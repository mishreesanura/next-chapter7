import { expect, test, type Page } from "@playwright/test";

const password = "Password123!";

async function register(page: Page, input: { name: string; email: string }) {
  await page.goto("/register");
  await page.waitForLoadState("networkidle");
  await page.getByLabel("Name").fill(input.name);
  await page.getByLabel("Email").fill(input.email);
  await page.getByLabel("Password").fill(password);
  await page.getByRole("button", { name: "Register" }).click();

  const dashboardHeading = page.getByRole("heading", { name: "Transaction extractor" });
  try {
    await expect(dashboardHeading).toBeVisible({ timeout: 10_000 });
    return;
  } catch {
    await expect(page.getByRole("heading", { name: "Log in" })).toBeVisible();
    await login(page, input);
  }
}

async function login(page: Page, input: { email: string }) {
  await page.goto("/login");
  await page.waitForLoadState("networkidle");
  await page.getByLabel("Email").fill(input.email);
  await page.getByLabel("Password").fill(password);
  await page.getByRole("button", { name: "Log in" }).click();
  await expect(page.getByRole("heading", { name: "Transaction extractor" })).toBeVisible();
}

async function logout(page: Page) {
  await page.getByRole("button", { name: "Logout" }).click();
  await expect(page.getByRole("heading", { name: "Log in" })).toBeVisible();
}

async function saveSample(page: Page, sample: "Sample 1" | "Sample 2" | "Sample 3", merchant: string) {
  await page.getByRole("button", { name: sample }).click();
  await page.getByRole("button", { name: "Parse & Save" }).click();
  await expect(page.getByRole("heading", { name: merchant })).toBeVisible();
  await expect(page.getByRole("cell", { name: merchant })).toBeVisible();
}

test("registers users, saves assignment samples, and keeps tenant data isolated", async ({ page }) => {
  const runId = Date.now();
  const userOne = {
    name: `E2E User One ${runId}`,
    email: `e2e-user-one-${runId}@example.com`
  };
  const userTwo = {
    name: `E2E User Two ${runId}`,
    email: `e2e-user-two-${runId}@example.com`
  };

  await register(page, userOne);
  await expect(page.getByRole("heading", { name: "No saved transactions" })).toBeVisible();

  await saveSample(page, "Sample 1", "Starbucks Coffee Mumbai");
  await saveSample(page, "Sample 2", "Uber Ride - Airport Drop");
  await saveSample(page, "Sample 3", "Amazon.in");

  await expect(page.getByRole("row", { name: /2025-12-11 Starbucks Coffee Mumbai/ })).toBeVisible();
  await expect(page.getByRole("row", { name: /2025-11-12 Uber Ride - Airport Drop/ })).toBeVisible();
  await expect(page.getByRole("row", { name: /2025-12-10 Amazon.in/ })).toBeVisible();
  await expect(page.getByRole("cell", { name: "Shopping" })).toBeVisible();

  await logout(page);
  await register(page, userTwo);

  await expect(page.getByRole("heading", { name: "No saved transactions" })).toBeVisible();
  await expect(page.locator("tbody tr")).toHaveCount(0);
  await expect(page.getByRole("cell", { name: "Starbucks Coffee Mumbai" })).toHaveCount(0);
  await expect(page.getByRole("cell", { name: "Uber Ride - Airport Drop" })).toHaveCount(0);
  await expect(page.getByRole("cell", { name: "Amazon.in" })).toHaveCount(0);

  await logout(page);
  await login(page, userOne);

  await expect(page.getByRole("cell", { name: "Starbucks Coffee Mumbai" })).toBeVisible();
  await expect(page.getByRole("cell", { name: "Uber Ride - Airport Drop" })).toBeVisible();
  await expect(page.getByRole("cell", { name: "Amazon.in" })).toBeVisible();
});
