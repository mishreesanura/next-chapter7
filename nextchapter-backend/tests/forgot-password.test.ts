import { app } from "../src/app.js";
import { prisma } from "../src/lib/prisma.js";
import { registerUser, resetDatabase } from "./helpers.js";
import { sentEmailsForTesting } from "../src/services/email.service.js";

beforeEach(async () => {
  await resetDatabase();
  // Clear the simulated email store before each test
  sentEmailsForTesting.length = 0;
});

afterAll(async () => {
  await prisma.$disconnect();
});

describe("Forgot Password Flow", () => {
  const genericSuccessMessage = "If an account with that email exists, a password reset link has been sent.";

  test("forgot-password returns generic success and generates token for valid user", async () => {
    await registerUser("user@example.com", "Password123!", "Test User");

    const response = await app.request("/api/auth/forgot-password", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ email: "user@example.com" })
    });

    expect(response.status).toBe(200);
    const body = (await response.json()) as any;
    expect(body.message).toBe(genericSuccessMessage);

    // Verify email was recorded in our test array
    expect(sentEmailsForTesting.length).toBe(1);
    expect(sentEmailsForTesting[0]).toMatchObject({
      to: "user@example.com",
      subject: "Reset Your Password"
    });

    // Check that token and expiration were written in the database
    const dbUser = await prisma.user.findUnique({
      where: { email: "user@example.com" }
    });
    expect(dbUser?.resetPasswordToken).toBeDefined();
    expect(dbUser?.resetPasswordToken).not.toBeNull();
    expect(dbUser?.resetPasswordExpires).toBeDefined();
    expect(dbUser?.resetPasswordExpires!.getTime()).toBeGreaterThan(Date.now());
  });

  test("forgot-password returns same generic success for non-existing email without sending email", async () => {
    const response = await app.request("/api/auth/forgot-password", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ email: "nonexisting@example.com" })
    });

    expect(response.status).toBe(200);
    const body = (await response.json()) as any;
    expect(body.message).toBe(genericSuccessMessage);

    // Verify no email was sent
    expect(sentEmailsForTesting.length).toBe(0);
  });

  test("forgot-password rejects invalid email format with 400", async () => {
    const response = await app.request("/api/auth/forgot-password", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ email: "invalid-email" })
    });

    expect(response.status).toBe(400);
  });
});

describe("Reset Password Flow", () => {
  let plainToken = "";
  let email = "user2@example.com";

  beforeEach(async () => {
    await registerUser(email, "Password123!", "Test User 2");

    // Trigger forgot password to get token
    await app.request("/api/auth/forgot-password", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ email })
    });

    // Extract the token from the simulated email store
    const emailInfo = sentEmailsForTesting[0];
    const htmlContent = emailInfo?.html || "";
    const match = htmlContent.match(/token=([a-f0-9]+)/);
    plainToken = match ? (match[1] || "") : "";
  });

  test("reset-password successfully updates password and invalidates token/sessions", async () => {
    // Attempt reset password
    const response = await app.request("/api/auth/reset-password", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        token: plainToken,
        password: "NewPassword123!",
        confirmPassword: "NewPassword123!"
      })
    });

    expect(response.status).toBe(200);
    const body = (await response.json()) as any;
    expect(body.message).toBe("Password reset successful.");

    // Verify token is cleared in the database
    const dbUser = await prisma.user.findUnique({ where: { email } });
    expect(dbUser?.resetPasswordToken).toBeNull();
    expect(dbUser?.resetPasswordExpires).toBeNull();

    // Verify login with OLD password fails
    const loginFailResponse = await app.request("/api/auth/login", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ email, password: "Password123!" })
    });
    expect(loginFailResponse.status).not.toBe(200);

    // Verify login with NEW password succeeds
    const loginSuccessResponse = await app.request("/api/auth/login", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ email, password: "NewPassword123!" })
    });
    expect(loginSuccessResponse.status).toBe(200);
  });

  test("reset-password rejects password mismatch", async () => {
    const response = await app.request("/api/auth/reset-password", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        token: plainToken,
        password: "NewPassword123!",
        confirmPassword: "DifferentPassword123!"
      })
    });

    expect(response.status).toBe(400);
    const body = (await response.json()) as any;
    expect(body.error).toContain("Passwords do not match");
  });

  test("reset-password rejects weak password", async () => {
    const response = await app.request("/api/auth/reset-password", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        token: plainToken,
        password: "weak",
        confirmPassword: "weak"
      })
    });

    expect(response.status).toBe(400);
    const body = (await response.json()) as any;
    expect(body.error).toContain("Password must be at least 8 characters");
  });

  test("reset-password rejects invalid/non-existent token", async () => {
    const response = await app.request("/api/auth/reset-password", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        token: "invalidtoken12345invalidtoken12345invalidtoken12345",
        password: "NewPassword123!",
        confirmPassword: "NewPassword123!"
      })
    });

    expect(response.status).toBe(400);
    const body = (await response.json()) as any;
    expect(body.error).toContain("Invalid or expired password reset token");
  });

  test("reset-password rejects reused token", async () => {
    // First reset succeeds
    const response1 = await app.request("/api/auth/reset-password", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        token: plainToken,
        password: "NewPassword123!",
        confirmPassword: "NewPassword123!"
      })
    });
    expect(response1.status).toBe(200);

    // Second reset fails
    const response2 = await app.request("/api/auth/reset-password", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        token: plainToken,
        password: "AnotherPassword123!",
        confirmPassword: "AnotherPassword123!"
      })
    });
    expect(response2.status).toBe(400);
  });

  test("reset-password rejects expired token", async () => {
    // Simulate expired token in DB
    const dbUser = await prisma.user.findUnique({ where: { email } });
    await prisma.user.update({
      where: { id: dbUser!.id },
      data: {
        resetPasswordExpires: new Date(Date.now() - 1000) // 1 second ago
      }
    });

    const response = await app.request("/api/auth/reset-password", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        token: plainToken,
        password: "NewPassword123!",
        confirmPassword: "NewPassword123!"
      })
    });

    expect(response.status).toBe(400);
    const body = (await response.json()) as any;
    expect(body.error).toContain("Invalid or expired password reset token");
  });
});
