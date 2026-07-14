import { HTTPException } from "hono/http-exception";
import { parserStrategies } from "./parser-strategies/index.js";
import { scoreSignal } from "./parser-strategies/utils.js";
import type { ParsedTransaction } from "../types/index.js";

export function parseTransactionText(text: string): ParsedTransaction {
  const normalized = text.trim();
  const strategy = parserStrategies.find((candidate) => candidate.canHandle(normalized));

  if (!strategy) {
    throw new HTTPException(422, {
      message:
        "Could not recognize this transaction format. Try including a date, amount, merchant, and balance."
    });
  }

  const signal = strategy.parse(normalized);
  const confidence = scoreSignal(signal);

  return {
    merchant: signal.merchant,
    amount: signal.amount,
    direction: signal.direction,
    balanceAfter: signal.balanceAfter,
    date: signal.date,
    category: signal.category,
    confidence: confidence.confidence,
    confidenceReasons: confidence.reasons,
    sourceFormat: signal.sourceFormat
  };
}
