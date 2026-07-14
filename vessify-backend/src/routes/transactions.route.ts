import { Hono } from "hono";
import { HTTPException } from "hono/http-exception";
import { z } from "zod";
import { requireAuth } from "../middleware/auth.middleware.js";
import { extractRateLimit } from "../middleware/rate-limit.middleware.js";
import { parseTransactionText } from "../services/transaction-parser.service.js";
import { listTransactions, saveParsedTransaction } from "../services/transaction.service.js";
import type { AppBindings } from "../types/index.js";

const extractSchema = z.object({
  text: z.string().trim().min(10).max(5_000)
});

const listSchema = z.object({
  cursor: z.string().optional(),
  limit: z.coerce.number().int().positive().max(50).optional()
});

export const transactionRoutes = new Hono<AppBindings>();

transactionRoutes.use("*", requireAuth);

transactionRoutes.post("/extract", extractRateLimit, async (c) => {
  const body = extractSchema.safeParse(await c.req.json());

  if (!body.success) {
    throw new HTTPException(400, {
      message: body.error.issues[0]?.message ?? "Invalid transaction payload."
    });
  }

  const parsed = parseTransactionText(body.data.text);
  const transaction = await saveParsedTransaction(c.get("auth"), body.data.text, parsed);

  return c.json({
    transaction
  });
});

transactionRoutes.get("/", async (c) => {
  const query = listSchema.safeParse(c.req.query());

  if (!query.success) {
    throw new HTTPException(400, {
      message: query.error.issues[0]?.message ?? "Invalid pagination query."
    });
  }

  return c.json(await listTransactions(c.get("auth"), query.data));
});
