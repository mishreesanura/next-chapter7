import type { Prisma, Transaction } from "@prisma/client";
import { HTTPException } from "hono/http-exception";
import { withOrganizationRls } from "../lib/prisma.js";
import type { AuthContext, ParsedTransaction } from "../types/index.js";

type CursorPayload = {
  date: string;
  id: string;
};

export type TransactionResponse = {
  id: string;
  rawText: string;
  merchant: string;
  amount: string;
  direction: "DEBIT" | "CREDIT";
  balanceAfter: string | null;
  date: string;
  category: string | null;
  confidence: number;
  confidenceReasons: string[];
  sourceFormat: string;
  createdAt: string;
};

function encodeCursor(payload: CursorPayload) {
  return Buffer.from(JSON.stringify(payload), "utf8").toString("base64url");
}

function decodeCursor(cursor: string): CursorPayload {
  try {
    const decoded = JSON.parse(Buffer.from(cursor, "base64url").toString("utf8")) as Partial<CursorPayload>;

    if (!decoded.date || !decoded.id) {
      throw new Error("Cursor payload is incomplete.");
    }

    return {
      date: decoded.date,
      id: decoded.id
    };
  } catch {
    throw new HTTPException(400, {
      message: "Invalid pagination cursor."
    });
  }
}

export function serializeTransaction(transaction: Transaction): TransactionResponse {
  return {
    id: transaction.id,
    rawText: transaction.rawText,
    merchant: transaction.merchant,
    amount: transaction.amount.toFixed(2),
    direction: transaction.direction,
    balanceAfter: transaction.balanceAfter?.toFixed(2) ?? null,
    date: transaction.date.toISOString().slice(0, 10),
    category: transaction.category,
    confidence: transaction.confidence,
    confidenceReasons: transaction.confidenceReasons,
    sourceFormat: transaction.sourceFormat,
    createdAt: transaction.createdAt.toISOString()
  };
}

export async function saveParsedTransaction(
  auth: AuthContext,
  rawText: string,
  parsed: ParsedTransaction
) {
  const transaction = await withOrganizationRls(auth.organizationId, async (tx) =>
    tx.transaction.create({
      data: {
        organizationId: auth.organizationId,
        userId: auth.userId,
        rawText,
        merchant: parsed.merchant,
        amount: Number(parsed.amount),
        direction: parsed.direction,
        balanceAfter: parsed.balanceAfter ? Number(parsed.balanceAfter) : null,
        date: parsed.date,
        category: parsed.category,
        confidence: parsed.confidence,
        confidenceReasons: parsed.confidenceReasons,
        sourceFormat: parsed.sourceFormat
      }
    })
  );

  return serializeTransaction(transaction);
}

export async function listTransactions(
  auth: AuthContext,
  options: {
    cursor?: string;
    limit?: number;
  }
) {
  const limit = Math.min(Math.max(options.limit ?? 20, 1), 50);
  const cursor = options.cursor ? decodeCursor(options.cursor) : null;
  const cursorDate = cursor ? new Date(cursor.date) : null;

  if (cursorDate && Number.isNaN(cursorDate.getTime())) {
    throw new HTTPException(400, {
      message: "Invalid pagination cursor date."
    });
  }

  const where: Prisma.TransactionWhereInput = {
    organizationId: auth.organizationId,
    ...(cursor && cursorDate
      ? {
          OR: [
            {
              date: {
                lt: cursorDate
              }
            },
            {
              date: cursorDate,
              id: {
                lt: cursor.id
              }
            }
          ]
        }
      : {})
  };

  const rows = await withOrganizationRls(auth.organizationId, async (tx) =>
    tx.transaction.findMany({
      where,
      orderBy: [
        {
          date: "desc"
        },
        {
          id: "desc"
        }
      ],
      take: limit + 1
    })
  );

  const visibleRows = rows.slice(0, limit);
  const last = visibleRows.at(-1);
  const nextCursor =
    rows.length > limit && last
      ? encodeCursor({
          date: last.date.toISOString(),
          id: last.id
        })
      : null;

  return {
    transactions: visibleRows.map(serializeTransaction),
    nextCursor
  };
}
