import { createMiddleware } from "hono/factory";
import { HTTPException } from "hono/http-exception";
import { env } from "../lib/env.js";
import type { AppBindings } from "../types/index.js";

type Bucket = {
  tokens: number;
  updatedAt: number;
};

const buckets = new Map<string, Bucket>();

export const extractRateLimit = createMiddleware<AppBindings>(async (c, next) => {
  const auth = c.get("auth");
  const now = Date.now();
  const maxTokens = env.EXTRACT_RATE_LIMIT_MAX;
  const refillPerMs = maxTokens / env.EXTRACT_RATE_LIMIT_WINDOW_MS;
  const bucket = buckets.get(auth.userId) ?? {
    tokens: maxTokens,
    updatedAt: now
  };

  const elapsed = now - bucket.updatedAt;
  bucket.tokens = Math.min(maxTokens, bucket.tokens + elapsed * refillPerMs);
  bucket.updatedAt = now;

  if (bucket.tokens < 1) {
    buckets.set(auth.userId, bucket);
    throw new HTTPException(429, {
      message: "Too many extraction requests. Please wait before trying again."
    });
  }

  bucket.tokens -= 1;
  buckets.set(auth.userId, bucket);

  await next();
});

const ipBuckets = new Map<string, Bucket>();

export const ipRateLimit = createMiddleware(async (c, next) => {
  if (process.env.NODE_ENV === "test") {
    await next();
    return;
  }
  const ip = c.req.header("x-forwarded-for") || "unknown";
  const now = Date.now();
  const maxTokens = 5; // max 5 requests
  const refillPerMs = maxTokens / 60000; // refill over 1 minute window
  const bucket = ipBuckets.get(ip) ?? {
    tokens: maxTokens,
    updatedAt: now
  };

  const elapsed = now - bucket.updatedAt;
  bucket.tokens = Math.min(maxTokens, bucket.tokens + elapsed * refillPerMs);
  bucket.updatedAt = now;

  if (bucket.tokens < 1) {
    ipBuckets.set(ip, bucket);
    throw new HTTPException(429, {
      message: "Too many password reset attempts. Please wait before trying again."
    });
  }

  bucket.tokens -= 1;
  ipBuckets.set(ip, bucket);

  await next();
});
