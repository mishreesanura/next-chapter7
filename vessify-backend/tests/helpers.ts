import { app } from "../src/app.js";
import { prisma } from "../src/lib/prisma.js";

export const samples = {
  sample1:
    "Date: 11 Dec 2025\nDescription: STARBUCKS COFFEE MUMBAI\nAmount: -420.00\nBalance after transaction: 18,420.50",
  sample2:
    "Uber Ride * Airport Drop\n12/11/2025 → ₹1,250.00 debited\nAvailable Balance → ₹17,170.50",
  sample3:
    "txn123 2025-12-10 Amazon.in Order #403-1234567-8901234 ₹2,999.00 Dr Bal 14171.50 Shopping"
};

export async function resetDatabase() {
  await Promise.all([
    prisma.transaction.deleteMany({}),
    prisma.jobApplication.deleteMany({}),
    prisma.teamMember.deleteMany({}),
    prisma.invitation.deleteMany({}),
    prisma.team.deleteMany({}),
    prisma.member.deleteMany({}),
    prisma.organization.deleteMany({}),
    prisma.jwks.deleteMany({}),
    prisma.session.deleteMany({}),
    prisma.account.deleteMany({}),
    prisma.verification.deleteMany({}),
    prisma.user.deleteMany({})
  ]);
}

export async function registerUser(email: string, password = "Password123!", name = "Test User") {
  const response = await app.request("/api/auth/register", {
    method: "POST",
    headers: {
      "content-type": "application/json"
    },
    body: JSON.stringify({
      email,
      password,
      name
    })
  });

  const body = await response.json();

  if (!response.ok) {
    throw new Error(`Registration failed: ${JSON.stringify(body)}`);
  }

  return body as {
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
}

export async function loginUser(email: string, password = "Password123!") {
  const response = await app.request("/api/auth/login", {
    method: "POST",
    headers: {
      "content-type": "application/json"
    },
    body: JSON.stringify({
      email,
      password
    })
  });

  const body = await response.json();

  if (!response.ok) {
    throw new Error(`Login failed: ${JSON.stringify(body)}`);
  }

  return body as Awaited<ReturnType<typeof registerUser>>;
}

export async function extract(jwt: string, text: string) {
  const response = await app.request("/api/transactions/extract", {
    method: "POST",
    headers: {
      "content-type": "application/json",
      authorization: `Bearer ${jwt}`
    },
    body: JSON.stringify({
      text
    })
  });

  const body = await response.json();

  if (!response.ok) {
    throw new Error(`Extraction failed: ${JSON.stringify(body)}`);
  }

  return body as {
    transaction: {
      id: string;
      merchant: string;
      amount: string;
      direction: "DEBIT" | "CREDIT";
      balanceAfter: string | null;
      date: string;
      category: string | null;
      confidence: number;
      confidenceReasons: string[];
      sourceFormat: string;
    };
  };
}

export async function list(jwt: string, query = "") {
  const response = await app.request(`/api/transactions${query}`, {
    method: "GET",
    headers: {
      authorization: `Bearer ${jwt}`
    }
  });

  const body = await response.json();

  if (!response.ok) {
    throw new Error(`List failed: ${JSON.stringify(body)}`);
  }

  return body as {
    transactions: Array<{
      id: string;
      merchant: string;
      date: string;
    }>;
    nextCursor: string | null;
  };
}
