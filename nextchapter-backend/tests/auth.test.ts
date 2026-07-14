import { app } from "../src/app.js";
import { prisma } from "../src/lib/prisma.js";
import { registerUser, resetDatabase } from "./helpers.js";

beforeEach(async () => {
  await resetDatabase();
});

afterAll(async () => {
  await prisma.$disconnect();
});

test("register creates a user, organization, and hashed credential account", async () => {
  const registered = await registerUser("alice@example.com", "Password123!", "Alice");

  expect(registered.user.email).toBe("alice@example.com");
  expect(registered.organization.id).toBeTruthy();
  expect(registered.jwt).toContain(".");

  const account = await prisma.account.findFirstOrThrow({
    where: {
      userId: registered.user.id,
      providerId: "credential"
    }
  });

  expect(account.password).toBeTruthy();
  expect(account.password).not.toBe("Password123!");
  expect(account.password).not.toContain("Password123!");
});

test("login with correct credentials returns a Better Auth session token and JWT", async () => {
  await registerUser("bob@example.com", "Password123!", "Bob");

  const response = await app.request("/api/auth/login", {
    method: "POST",
    headers: {
      "content-type": "application/json"
    },
    body: JSON.stringify({
      email: "bob@example.com",
      password: "Password123!"
    })
  });

  const body = (await response.json()) as {
    sessionToken: string;
    jwt: string;
    organization: {
      id: string;
    };
  };

  expect(response.status).toBe(200);
  expect(body.sessionToken).toEqual(expect.any(String));
  expect(body.jwt).toContain(".");
  expect(body.organization.id).toEqual(expect.any(String));
});

test("login with a wrong password is rejected", async () => {
  await registerUser("carol@example.com", "Password123!", "Carol");

  const response = await app.request("/api/auth/login", {
    method: "POST",
    headers: {
      "content-type": "application/json"
    },
    body: JSON.stringify({
      email: "carol@example.com",
      password: "WrongPassword123!"
    })
  });

  expect(response.status).not.toBe(200);
});
