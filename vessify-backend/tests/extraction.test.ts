import { prisma } from "../src/lib/prisma.js";
import { app } from "../src/app.js";
import { extract, registerUser, resetDatabase, samples } from "./helpers.js";

beforeEach(async () => {
  await resetDatabase();
});

afterAll(async () => {
  await prisma.$disconnect();
});

test("extract parses Sample 1 exactly", async () => {
  const user = await registerUser("sample1@example.com");
  const result = await extract(user.jwt, samples.sample1);

  expect(result.transaction).toMatchObject({
    merchant: "Starbucks Coffee Mumbai",
    amount: "420.00",
    direction: "DEBIT",
    balanceAfter: "18420.50",
    date: "2025-12-11",
    category: null,
    sourceFormat: "clean labeled format"
  });
  expect(result.transaction.confidence).toBeGreaterThanOrEqual(0.9);
});

test("extract parses Sample 2 as Indian DD/MM/YYYY", async () => {
  const user = await registerUser("sample2@example.com");
  const result = await extract(user.jwt, samples.sample2);

  expect(result.transaction).toMatchObject({
    merchant: "Uber Ride - Airport Drop",
    amount: "1250.00",
    direction: "DEBIT",
    balanceAfter: "17170.50",
    date: "2025-11-12",
    category: null,
    sourceFormat: "Indian debit format with available balance"
  });
  expect(result.transaction.confidenceReasons.join(" ")).toContain("DD/MM/YYYY parsed as Indian date");
});

test("extract parses Sample 3 messy compact statement", async () => {
  const user = await registerUser("sample3@example.com");
  const result = await extract(user.jwt, samples.sample3);

  expect(result.transaction).toMatchObject({
    merchant: "Amazon.in",
    amount: "2999.00",
    direction: "DEBIT",
    balanceAfter: "14171.50",
    date: "2025-12-10",
    category: "Shopping",
    sourceFormat: "messy compact bank line"
  });
});

test("extract rate limit is enforced per authenticated user", async () => {
  const user = await registerUser("rate-limit@example.com");
  let blocked: Response | null = null;

  for (let i = 0; i < 25; i += 1) {
    const response = await app.request("/api/transactions/extract", {
      method: "POST",
      headers: {
        "content-type": "application/json",
        authorization: `Bearer ${user.jwt}`
      },
      body: JSON.stringify({
        text: samples.sample1
      })
    });

    if (response.status === 429) {
      blocked = response;
      break;
    }

    expect(response.status).toBe(200);
  }

  if (!blocked) {
    throw new Error("Expected the authenticated user to hit the extract rate limit within 25 requests.");
  }

  expect(blocked.status).toBe(429);
  await expect(blocked.json()).resolves.toMatchObject({
    error: "Too many extraction requests. Please wait before trying again."
  });
});
