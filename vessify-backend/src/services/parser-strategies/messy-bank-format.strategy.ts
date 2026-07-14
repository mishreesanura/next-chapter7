import type { ParserSignal, ParserStrategy } from "./types.js";
import {
  balanceAdjustment,
  directionFromAmountOrKeyword,
  normalizeWhitespace,
  parseIsoDate,
  parseMoney,
  requireMatch,
  titleCaseMerchant
} from "./utils.js";

const KNOWN_TRAILING_CATEGORIES = new Set([
  "shopping",
  "food",
  "travel",
  "fuel",
  "bills",
  "salary",
  "transfer"
]);

function cleanMessyMerchant(segment: string) {
  const withoutOrder = segment.replace(/\s+Order\s+#?[A-Z0-9-]+/i, "");
  const firstToken = withoutOrder.trim().split(/\s+/)[0] ?? withoutOrder.trim();
  return titleCaseMerchant(firstToken);
}

export const messyBankFormatStrategy: ParserStrategy = {
  name: "messy-bank-line",
  canHandle(text: string) {
    return /\btxn\w*\b/i.test(text) && /\d{4}-\d{2}-\d{2}/.test(text) && /\bBal\b/i.test(text);
  },
  parse(text: string): ParserSignal {
    const normalized = normalizeWhitespace(text);
    const match = requireMatch(
      normalized.match(/\btxn\w*\s+(\d{4}-\d{2}-\d{2})\s+(.+?)\s+₹\s*([\d,]+(?:\.\d{2})?)\s+(Dr|Cr)\s+Bal\s+([\d,]+(?:\.\d{2})?)(?:\s+([A-Za-z]+))?/i),
      "Messy transaction line could not be parsed."
    );
    const categoryCandidate = match[6]?.trim();
    const category =
      categoryCandidate && KNOWN_TRAILING_CATEGORIES.has(categoryCandidate.toLowerCase())
        ? titleCaseMerchant(categoryCandidate)
        : null;
    const balanceAfter = parseMoney(match[5]!);

    return {
      merchant: cleanMessyMerchant(match[2]!),
      amount: parseMoney(match[3]!),
      direction: directionFromAmountOrKeyword(match[3]!, match[4]!),
      balanceAfter,
      date: parseIsoDate(match[1]!),
      category,
      sourceFormat: "messy compact bank line",
      baseConfidence: 0.76,
      confidenceAdjustments: [
        balanceAdjustment(balanceAfter),
        {
          delta: 0.03,
          reason: "ISO date found"
        },
        category
          ? {
              delta: 0.03,
              reason: "trailing category extracted"
            }
          : {
              delta: -0.03,
              reason: "no category detected"
            }
      ]
    };
  }
};
