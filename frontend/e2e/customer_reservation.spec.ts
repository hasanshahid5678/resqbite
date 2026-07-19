import { expect, test } from "@playwright/test";

/**
 * E2E scenario #2 — customer reserves an item and sees the QR confirmation.
 *
 * Uses the seeded alice@example.com account and the first available listing on
 * the browse page.
 */
test("alice can reserve a listing and receive a QR code", async ({ page }) => {
  // Login as alice
  await page.goto("/login");
  await page.getByLabel(/^email$/i).fill("alice@example.com");
  await page.getByLabel(/password/i).fill("password123");
  await page.getByRole("button", { name: /continue/i }).click();
  await page.waitForURL("**/customer/dashboard");

  // Go to browse
  await page.getByRole("link", { name: /browse listings/i }).first().click();
  await page.waitForURL("**/customer/browse");
  await expect(page.getByRole("heading", { name: /discover great meals near you/i })).toBeVisible();

  // Wait for at least one listing card to load
  const firstListingLink = page.locator('a[href^="/customer/listings/"]').first();
  await expect(firstListingLink).toBeVisible({ timeout: 10_000 });

  // Read the title BEFORE clicking (from the card) for assert later
  const cardTitle = (await firstListingLink.locator("h3").textContent()) || "";
  expect(cardTitle.trim()).not.toBe("");

  // Click into the listing
  await firstListingLink.click();
  await page.waitForURL(/\/customer\/listings\/\d+$/);
  await expect(page.getByRole("heading", { level: 1, name: cardTitle.trim() })).toBeVisible();

  // Reserve default quantity (1)
  const reserveBtn = page.getByRole("button", { name: /reserve /i }).first();
  await expect(reserveBtn).toBeVisible();
  await reserveBtn.click();

  // Should see confirmation
  await expect(page.getByRole("heading", { name: /reservation confirmed/i })).toBeVisible({
    timeout: 10_000,
  });
  await expect(page.locator('img[alt="Reservation QR code"]')).toBeVisible();
  await expect(page.getByText(cardTitle.trim()).first()).toBeVisible();

  // Visit reservations page to confirm it's listed
  await page.getByRole("button", { name: /view reservations/i }).click();
  await page.waitForURL("**/customer/reservations");
  await expect(page.getByRole("heading", { name: /pickups & history/i })).toBeVisible();
});