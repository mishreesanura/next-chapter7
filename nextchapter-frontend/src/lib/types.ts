export type TransactionDirection = "DEBIT" | "CREDIT";

export type Transaction = {
  id: string;
  rawText: string;
  merchant: string;
  amount: string;
  direction: TransactionDirection;
  balanceAfter: string | null;
  date: string;
  category: string | null;
  confidence: number;
  confidenceReasons: string[];
  sourceFormat: string;
  createdAt: string;
};

export type AuthPayload = {
  user: {
    id: string;
    email: string;
    name: string;
  };
  organization: {
    id: string;
    name: string;
    slug: string;
  };
  sessionToken: string;
  jwt: string;
};

export type TransactionsPage = {
  transactions: Transaction[];
  nextCursor: string | null;
};

export type JobApplication = {
  id: string;
  rawText: string;
  companyName: string;
  roles: string;
  stipend: string | null;
  location: string | null;
  duration: string | null;
  eligibility: string | null;
  deadline: string | null;
  applicationLink: string | null;
  status: string;
  createdAt: string;
  updatedAt: string;
};

export type JobApplicationsPage = {
  jobApplications: JobApplication[];
  nextCursor: string | null;
};

export type JobApplicationStats = {
  appliedCount: number;
  interviewingCount: number;
  notAppliedCount: number;
  rejectedCount: number;
};

