import { HTTPException } from "hono/http-exception";
import type { ConfidenceAdjustment, ParserSignal } from "./types.js";

const MONTH_INDEX: Record<string, number> = {
  jan: 0,
  january: 0,
  feb: 1,
  february: 1,
  mar: 2,
  march: 2,
  apr: 3,
  april: 3,
  may: 4,
  jun: 5,
  june: 5,
  jul: 6,
  july: 6,
  aug: 7,
  august: 7,
  sep: 8,
  sept: 8,
  september: 8,
  oct: 9,
  october: 9,
  nov: 10,
  november: 10,
  dec: 11,
  december: 11
};

export function requireMatch(match: RegExpMatchArray | null, message: string): RegExpMatchArray {
  if (!match) {
    throw new HTTPException(422, {
      message
    });
  }

  return match;
}

export function normalizeWhitespace(text: string) {
  return text.replace(/\s+/g, " ").trim();
}

export function titleCaseMerchant(input: string) {
  return normalizeWhitespace(input)
    .toLowerCase()
    .split(" ")
    .map((word) => {
      if (word.includes(".")) {
        const [firstPiece, ...rest] = word.split(".");
        const first = firstPiece ? firstPiece[0]!.toUpperCase() + firstPiece.slice(1) : "";
        return [first, ...rest].join(".");
      }

      return word ? word[0]!.toUpperCase() + word.slice(1) : word;
    })
    .join(" ");
}

export function parseMoney(value: string) {
  const cleaned = value.replace(/[₹,\s]/g, "").replace(/^\+/, "");
  const unsigned = cleaned.replace(/^-/, "");
  const parsed = Number.parseFloat(unsigned);

  if (!Number.isFinite(parsed)) {
    throw new HTTPException(422, {
      message: `Could not parse amount: ${value}`
    });
  }

  return parsed.toFixed(2);
}

export function directionFromAmountOrKeyword(amountText: string, keywordText: string) {
  const combined = `${amountText} ${keywordText}`.toLowerCase();

  if (amountText.trim().startsWith("-") || /\b(debited|debit|dr)\b/.test(combined)) {
    return "DEBIT" as const;
  }

  if (amountText.trim().startsWith("+") || /\b(credited|credit|cr)\b/.test(combined)) {
    return "CREDIT" as const;
  }

  return "DEBIT" as const;
}

export function parseDayMonthYear(input: string) {
  const match = requireMatch(input.match(/^(\d{1,2})\s+([A-Za-z]+)\s+(\d{4})$/), `Could not parse date: ${input}`);
  const day = Number(match[1]);
  const month = MONTH_INDEX[match[2]!.toLowerCase()];
  const year = Number(match[3]);

  if (month === undefined) {
    throw new HTTPException(422, {
      message: `Unknown month in date: ${input}`
    });
  }

  return new Date(Date.UTC(year, month, day));
}

export function parseIndianSlashDate(input: string) {
  const match = requireMatch(input.match(/^(\d{2})\/(\d{2})\/(\d{4})$/), `Could not parse date: ${input}`);
  const day = Number(match[1]);
  const month = Number(match[2]) - 1;
  const year = Number(match[3]);

  return new Date(Date.UTC(year, month, day));
}

export function parseIsoDate(input: string) {
  const match = requireMatch(input.match(/^(\d{4})-(\d{2})-(\d{2})$/), `Could not parse date: ${input}`);

  return new Date(Date.UTC(Number(match[1]), Number(match[2]) - 1, Number(match[3])));
}

export function scoreSignal(signal: ParserSignal) {
  const raw = signal.confidenceAdjustments.reduce(
    (score, adjustment) => score + adjustment.delta,
    signal.baseConfidence
  );
  const confidence = Math.min(1, Math.max(0, Number(raw.toFixed(2))));
  const reasons = [
    `${signal.baseConfidence.toFixed(2)} base: ${signal.sourceFormat}`,
    ...signal.confidenceAdjustments.map((adjustment) => {
      const prefix = adjustment.delta >= 0 ? "+" : "";
      return `${prefix}${adjustment.delta.toFixed(2)} ${adjustment.reason}`;
    })
  ];

  return {
    confidence,
    reasons
  };
}

export function balanceAdjustment(balanceAfter: string | null): ConfidenceAdjustment {
  return balanceAfter
    ? {
        delta: 0.04,
        reason: "balance found"
      }
    : {
        delta: -0.08,
        reason: "balance missing"
      };
}
