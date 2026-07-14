export type AuthContext = {
  userId: string;
  organizationId: string;
  email?: string;
  name?: string;
};

export type AppBindings = {
  Variables: {
    auth: AuthContext;
  };
};

export type TransactionDirection = "DEBIT" | "CREDIT";

export type ParsedTransaction = {
  merchant: string;
  amount: string;
  direction: TransactionDirection;
  balanceAfter: string | null;
  date: Date;
  category: string | null;
  confidence: number;
  confidenceReasons: string[];
  sourceFormat: string;
};
