import type { ParserSignal, ParserStrategy } from "./types.js";
import {
  balanceAdjustment,
  directionFromAmountOrKeyword,
  parseDayMonthYear,
  parseMoney,
  requireMatch,
  titleCaseMerchant
} from "./utils.js";

export const labeledFormatStrategy: ParserStrategy = {
  name: "labeled-bank-statement",
  canHandle(text: string) {
    return /Date:\s*/i.test(text) && /Description:\s*/i.test(text) && /Amount:\s*/i.test(text);
  },
  parse(text: string): ParserSignal {
    const date = requireMatch(text.match(/Date:\s*([0-9]{1,2}\s+[A-Za-z]+\s+[0-9]{4})/i), "Date not found.")[1]!;
    const merchant = requireMatch(text.match(/Description:\s*([^\n/]+)/i), "Description not found.")[1]!;
    const amount = requireMatch(text.match(/Amount:\s*([+-]?[₹,\d.]+)/i), "Amount not found.")[1]!;
    const balance = text.match(/Balance after transaction:\s*([₹,\d.]+)/i)?.[1] ?? null;
    const balanceAfter = balance ? parseMoney(balance) : null;

    return {
      merchant: titleCaseMerchant(merchant),
      amount: parseMoney(amount),
      direction: directionFromAmountOrKeyword(amount, ""),
      balanceAfter,
      date: parseDayMonthYear(date),
      category: null,
      sourceFormat: "clean labeled format",
      baseConfidence: 0.9,
      confidenceAdjustments: [
        balanceAdjustment(balanceAfter),
        {
          delta: 0.03,
          reason: "unambiguous day month year date"
        }
      ]
    };
  }
};
