import { prisma } from "../src/lib/prisma.js";
import { extract, list, registerUser, resetDatabase, samples } from "./helpers.js";

beforeEach(async () => {
  await resetDatabase();
});

afterAll(async () => {
  await prisma.$disconnect();
});

test("tenant isolation ignores a forged organizationId query", async () => {
  const alice = await registerUser("tenant-a@example.com", "Password123!", "Tenant A");
  const bob = await registerUser("tenant-b@example.com", "Password123!", "Tenant B");

  await extract(alice.jwt, samples.sample1);
  await extract(bob.jwt, samples.sample2);

  const forged = await list(alice.jwt, `?organizationId=${bob.organization.id}`);

  expect(forged.transactions).toHaveLength(1);
  expect(forged.transactions[0]?.merchant).toBe("Starbucks Coffee Mumbai");
  expect(forged.transactions.some((transaction) => transaction.merchant.includes("Uber"))).toBe(false);
});

test("cursor pagination returns a next cursor without repeat or skip", async () => {
  const user = await registerUser("pagination@example.com");

  const first = await extract(user.jwt, samples.sample1);
  const second = await extract(user.jwt, samples.sample2);
  const third = await extract(user.jwt, samples.sample3);

  const pageOne = await list(user.jwt, "?limit=2");
  expect(pageOne.transactions).toHaveLength(2);
  expect(pageOne.nextCursor).toEqual(expect.any(String));

  const pageTwo = await list(user.jwt, `?limit=2&cursor=${pageOne.nextCursor}`);
  const ids = [...pageOne.transactions, ...pageTwo.transactions].map((transaction) => transaction.id);

  expect(new Set(ids).size).toBe(3);
  expect(ids.sort()).toEqual([first.transaction.id, second.transaction.id, third.transaction.id].sort());
  expect(pageTwo.nextCursor).toBeNull();
});
