import { Hono } from "hono";
import { isAPIError } from "better-auth/api";
import { cors } from "hono/cors";
import { HTTPException } from "hono/http-exception";
import { auth } from "./lib/auth.js";
import { env } from "./lib/env.js";
import { authRoutes } from "./routes/auth.route.js";
import { transactionRoutes } from "./routes/transactions.route.js";
import { jobApplicationRoutes } from "./routes/job-applications.route.js";
import type { AppBindings } from "./types/index.js";

export const app = new Hono<AppBindings>();

app.use(
  "*",
  cors({
    origin: env.FRONTEND_ORIGIN.replace(/\/$/, ""),
    credentials: true,
    allowHeaders: ["Content-Type", "Authorization"],
    allowMethods: ["GET", "POST", "PATCH", "DELETE", "OPTIONS"],
    exposeHeaders: ["set-auth-token"]
  })
);

app.get("/health", (c) =>
  c.json({
    ok: true,
    service: "nextchapter-backend"
  })
);

app.route("/api/auth", authRoutes);
app.on(["GET", "POST"], "/api/auth/*", (c) => auth.handler(c.req.raw));
app.route("/api/transactions", transactionRoutes);
app.route("/api/job-applications", jobApplicationRoutes);

app.notFound((c) =>
  c.json(
    {
      error: "Not found"
    },
    404
  )
);

app.onError((error, c) => {
  if (error instanceof HTTPException) {
    return c.json(
      {
        error: error.message
      },
      error.status
    );
  }

  if (isAPIError(error)) {
    const status = typeof error.statusCode === "number" ? error.statusCode : 400;

    return c.json(
      {
        error: error.body?.message ?? error.message
      },
      status as 400
    );
  }

  console.error(error);

  return c.json(
    {
      error: error instanceof Error ? error.message : "Internal server error",
      stack: error instanceof Error ? error.stack : undefined
    },
    500
  );
});
