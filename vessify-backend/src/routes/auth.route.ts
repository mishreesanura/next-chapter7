import { Hono } from "hono";
import type { Context } from "hono";
import { HTTPException } from "hono/http-exception";
import { z } from "zod";
import { loginWithOrganization, registerWithOrganization } from "../services/auth.service.js";

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
