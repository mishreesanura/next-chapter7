import { Hono } from "hono";
import type { Context } from "hono";
import { HTTPException } from "hono/http-exception";
import { z } from "zod";
import { randomBytes, createHash } from "node:crypto";
import { loginWithOrganization, registerWithOrganization } from "../services/auth.service.js";
import { prisma } from "../lib/prisma.js";
import { sendEmail } from "../services/email.service.js";
import { env } from "../lib/env.js";
import { hashPassword } from "better-auth/crypto";
import { ipRateLimit } from "../middleware/rate-limit.middleware.js";

const registerSchema = z.object({
  email: z.email(),
  password: z.string().min(8).max(128),
  name: z.string().min(1).max(120).optional()
});

const loginSchema = z.object({
  email: z.email(),
  password: z.string().min(8).max(128)
});

function forwardSetCookie(c: Context, headers: Headers) {
  const setCookie = headers.get("set-cookie");

  if (setCookie) {
    c.header("set-cookie", setCookie);
  }
}

export const authRoutes = new Hono();

authRoutes.post("/register", async (c) => {
  const body = registerSchema.safeParse(await c.req.json());

  if (!body.success) {
    throw new HTTPException(400, {
      message: body.error.issues[0]?.message ?? "Invalid registration payload."
    });
  }

  const result = await registerWithOrganization(body.data);
  forwardSetCookie(c, result.headers);

  return c.json(result.data, 201);
});

authRoutes.post("/login", async (c) => {
  const body = loginSchema.safeParse(await c.req.json());

  if (!body.success) {
    throw new HTTPException(400, {
      message: body.error.issues[0]?.message ?? "Invalid login payload."
    });
  }

  const result = await loginWithOrganization(body.data);
  forwardSetCookie(c, result.headers);

  return c.json(result.data);
});

const forgotPasswordSchema = z.object({
  email: z.string().email("Enter a valid email address.")
});

const resetPasswordSchema = z.object({
  token: z.string(),
  password: z.string().min(8, "Password must be at least 8 characters."),
  confirmPassword: z.string().min(8, "Password must be at least 8 characters.")
});

const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&#^()_+=\[\]{}|\\;:'",.<>/?`~-]).{8,128}$/;

authRoutes.post("/forgot-password", ipRateLimit, async (c) => {
  const body = forgotPasswordSchema.safeParse(await c.req.json());

  if (!body.success) {
    throw new HTTPException(400, {
      message: body.error.issues[0]?.message ?? "Invalid request payload."
    });
  }

  const { email } = body.data;

  try {
    const user = await prisma.user.findUnique({
      where: { email }
    });

    if (user) {
      const plainToken = randomBytes(32).toString("hex");
      const hashedToken = createHash("sha256").update(plainToken).digest("hex");
      const expiresAt = new Date(Date.now() + 15 * 60 * 1000); // 15 minutes

      await prisma.user.update({
        where: { id: user.id },
        data: {
          resetPasswordToken: hashedToken,
          resetPasswordExpires: expiresAt
        }
      });

      const resetLink = `${env.FRONTEND_URL}/reset-password?token=${plainToken}`;

      await sendEmail({
        to: user.email,
        subject: "Reset Your Password",
        html: `<!DOCTYPE html>
<html>
<head>
  <style>
    body { font-family: 'Inter', sans-serif; color: #1f2937; background-color: #f9fafb; margin: 0; padding: 0; }
    .container { max-width: 600px; margin: 40px auto; padding: 32px; background-color: #ffffff; border-radius: 8px; border: 1px solid #e5e7eb; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1); }
    .header { font-size: 24px; font-weight: 700; color: #111827; margin-bottom: 24px; text-align: center; }
    .button-container { text-align: center; margin: 32px 0; }
    .button { background-color: #2563eb; color: #ffffff !important; padding: 12px 24px; border-radius: 6px; text-decoration: none; font-weight: 600; display: inline-block; }
    .footer { font-size: 14px; color: #6b7280; margin-top: 32px; border-top: 1px solid #e5e7eb; padding-top: 24px; }
    .link-text { word-break: break-all; color: #2563eb; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">NextChapter</div>
    <p>Hello ${user.name || "there"},</p>
    <p>We received a request to reset the password for your NextChapter account. Click the button below to choose a new password. This link is only valid for 15 minutes.</p>
    <div class="button-container">
      <a href="${resetLink}" class="button">Reset Password</a>
    </div>
    <p>If the button doesn't work, you can also copy and paste the following link into your browser:</p>
    <p class="link-text">${resetLink}</p>
    <p>If you did not request a password reset, you can safely ignore this email.</p>
    <div class="footer">
      <p>Thanks,<br>The NextChapter Team</p>
    </div>
  </div>
</body>
</html>`
      });
    }
  } catch (error) {
    console.error("[ForgotPassword] Error in forgot-password flow:", error);
  }

  // Always return the exact same success response
  return c.json({
    message: "If an account with that email exists, a password reset link has been sent."
  });
});

authRoutes.post("/reset-password", async (c) => {
  const body = resetPasswordSchema.safeParse(await c.req.json());

  if (!body.success) {
    throw new HTTPException(400, {
      message: body.error.issues[0]?.message ?? "Invalid request payload."
    });
  }

  const { token, password, confirmPassword } = body.data;

  if (!passwordRegex.test(password)) {
    throw new HTTPException(400, {
      message: "Password must be at least 8 characters and contain at least one uppercase letter, one lowercase letter, one number, and one special character."
    });
  }

  if (password !== confirmPassword) {
    throw new HTTPException(400, {
      message: "Passwords do not match."
    });
  }

  const hashedToken = createHash("sha256").update(token).digest("hex");

  const user = await prisma.user.findFirst({
    where: {
      resetPasswordToken: hashedToken,
      resetPasswordExpires: {
        gt: new Date()
      }
    }
  });

  if (!user) {
    throw new HTTPException(400, {
      message: "Invalid or expired password reset token."
    });
  }

  const hashedPassword = await hashPassword(password);

  // Update password in Account model
  await prisma.account.updateMany({
    where: {
      userId: user.id,
      providerId: "credential"
    },
    data: {
      password: hashedPassword
    }
  });

  // Clear reset token and expiration
  await prisma.user.update({
    where: { id: user.id },
    data: {
      resetPasswordToken: null,
      resetPasswordExpires: null
    }
  });

  // Invalidate existing sessions
  await prisma.session.deleteMany({
    where: {
      userId: user.id
    }
  });

  return c.json({
    message: "Password reset successful."
  });
});
