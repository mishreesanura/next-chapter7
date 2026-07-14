import type { ParsedTransaction, TransactionDirection } from "../../types/index.js";

export type ParserSignal = {
  merchant: string;
  amount: string;
  direction: TransactionDirection;
  balanceAfter: string | null;
  date: Date;
  category: string | null;
  sourceFormat: string;
  baseConfidence: number;
  confidenceAdjustments: ConfidenceAdjustment[];
};

export type ConfidenceAdjustment = {
  delta: number;
  reason: string;
};

export type ParserStrategy = {
  name: string;
  canHandle(text: string): boolean;
  parse(text: string): ParserSignal;
};

export type ParserResult = ParsedTransaction;
