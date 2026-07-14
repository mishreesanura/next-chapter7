import "dotenv/config";

process.env.NODE_ENV = "test";
process.env.DATABASE_URL =
  process.env.TEST_DATABASE_URL ??
  process.env.DATABASE_URL ??
  "postgresql://vessify:vessify@localhost:5432/vessify_test?schema=public";
process.env.BETTER_AUTH_SECRET =
  process.env.BETTER_AUTH_SECRET ?? "test-secret-at-least-thirty-two-characters";
process.env.BETTER_AUTH_URL = process.env.BETTER_AUTH_URL ?? "http://localhost:4000";
process.env.FRONTEND_ORIGIN = process.env.FRONTEND_ORIGIN ?? "http://localhost:3000";
process.env.EXTRACT_RATE_LIMIT_WINDOW_MS = "60000";
process.env.EXTRACT_RATE_LIMIT_MAX = "12";
