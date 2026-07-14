import { indianDebitFormatStrategy } from "./indian-debit-format.strategy.js";
import { labeledFormatStrategy } from "./labeled-format.strategy.js";
import { messyBankFormatStrategy } from "./messy-bank-format.strategy.js";
import type { ParserStrategy } from "./types.js";

export const parserStrategies: ParserStrategy[] = [
  labeledFormatStrategy,
  indianDebitFormatStrategy,
  messyBankFormatStrategy
];
