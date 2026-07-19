import { expect, test } from "@playwright/test";

/**
 * E2E scenario #1 — register a brand-new customer and sign in.
 *
 * Assumes the dev stack is up. Carefully avoids colliding with seed data
 * emails by using a unique timestamped email.
 */
test("customer can register and sign in", async ({ page }) => {
  const email = `e2e_customer_${Date.now()}@example.com`;
  const password = "password123";

  await page.goto("/register");
  await expect(page).toHaveURL(/\/register$/);
  await expect(page.getByRole("heading", { name: /join resqbite/i })).toBeVisible();

  // Customer role is default — leave it
  await page.getByLabel(/full name/i).fill("E2E Customer");
  await page.getByLabel(/^email$/i).fill(email);
  await page.getByLabel(/password/i).fill(password);
  await page.getByRole("button", { name: /create account/i }).click();

  // Should land on /customer/dashboard
  await page.waitForURL("**/customer/dashboard", { timeout: 15_000 });
  await expect(page).toHaveURL(/\/customer\/dashboard/);
  await expect(page.getByRole("heading", { name: /welcome back/i })).toBeVisible();
  await expect(page.getByText(/E2E Customer/)).toBeVisible();

  // Sidebar shows user email
  await expect(page.getByText(email)).toBeVisible();
});

test("customer is sent to dashboard after login", async ({ page }) => {
  await page.goto("/login");
  await page.getByLabel(/^email$/i).fill("alice@example.com");
  await page.getByLabel(/password/i).fill("password123");
  await page.getByRole("button", { name: /continue/i }).click();
  await page.waitForURL("**/customer/dashboard", { timeout: 10_000 });
  await expect(page.getByRole("heading", { name: /welcome back/i })).toBeVisible();
});