import type { ParserSignal, ParserStrategy } from "./types.js";
import {
  balanceAdjustment,
  directionFromAmountOrKeyword,
  normalizeWhitespace,
  parseIndianSlashDate,
  parseMoney,
  requireMatch,
  titleCaseMerchant
} from "./utils.js";

function cleanMerchant(input: string) {
  return titleCaseMerchant(input.replace(/\*/g, " - ").replace(/\s+-\s+/g, " - "));
}

export const indianDebitFormatStrategy: ParserStrategy = {
  name: "indian-debit-with-available-balance",
  canHandle(text: string) {
    return /\d{2}\/\d{2}\/\d{4}/.test(text) && /Available Balance/i.test(text);
  },
  parse(text: string): ParserSignal {
    const normalized = normalizeWhitespace(text);
    const merchant = requireMatch(normalized.match(/^(.+?)\s+\d{2}\/\d{2}\/\d{4}/), "Merchant not found.")[1]!;
    const date = requireMatch(normalized.match(/(\d{2}\/\d{2}\/\d{4})/), "Date not found.")[1]!;
    const amountMatch = requireMatch(
      normalized.match(/₹\s*([\d,]+(?:\.\d{2})?)\s*(debited|credited|debit|credit|dr|cr)/i),
      "Amount and direction not found."
    );
    const balance = normalized.match(/Available Balance\s*(?:→|->)?\s*₹\s*([\d,]+(?:\.\d{2})?)/i)?.[1] ?? null;
    const balanceAfter = balance ? parseMoney(balance) : null;

    return {
      merchant: cleanMerchant(merchant),
      amount: parseMoney(amountMatch[1]!),
      direction: directionFromAmountOrKeyword(amountMatch[1]!, amountMatch[2]!),
      balanceAfter,
      date: parseIndianSlashDate(date),
      category: null,
      sourceFormat: "Indian debit format with available balance",
      baseConfidence: 0.84,
      confidenceAdjustments: [
        balanceAdjustment(balanceAfter),
        {
          delta: 0.02,
          reason: "DD/MM/YYYY parsed as Indian date"
        }
      ]
    };
  }
};
