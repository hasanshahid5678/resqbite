import { expect, test } from "@playwright/test";

/**
 * E2E scenario #3 — restaurant owner verifies an incoming pickup.
 *
 * Steps:
 *   1. Customer (alice) reserves an item.
 *   2. Restaurant owner (green@example.com) sees the reservation, opens it,
 *      and marks it as picked up.
 *
 * Uses seed listings from Green Bistro (restaurant id 1).
 */
test("restaurant owner marks a reservation as picked up", async ({ browser }) => {
  const customerCtx = await browser.newContext();
  const customerPage = await customerCtx.newPage();

  // --- Customer side: reserve a fresh listing with quantity left ---
  await customerPage.goto("/login");
  await customerPage.getByLabel(/^email$/i).fill("alice@example.com");
  await customerPage.getByLabel(/password/i).fill("password123");
  await customerPage.getByRole("button", { name: /continue/i }).click();
  await customerPage.waitForURL("**/customer/dashboard");

  await customerPage.goto("/customer/browse");
  // Wait for cards
  const cards = customerPage.locator('a[href^="/customer/listings/"]');
  await expect(cards.first()).toBeVisible({ timeout: 10_000 });
  // Pick the first card that has an "available" badge to ensure reserving works
  const availableCard = customerPage.locator('a[href^="/customer/listings/"]', { hasText: /available/i }).first();
  await expect(availableCard).toBeVisible({ timeout: 5_000 });
  const cardTitle = (await availableCard.locator("h3").textContent() || "").trim();
  expect(cardTitle).not.toBe("");
  await availableCard.click();

  await customerPage.waitForURL(/\/customer\/listings\/\d+$/);
  await expect(customerPage.getByRole("button", { name: /reserve /i })).toBeVisible({ timeout: 5_000 });
  await customerPage.getByRole("button", { name: /reserve /i }).click();
  await expect(customerPage.getByRole("heading", { name: /reservation confirmed/i })).toBeVisible({ timeout: 10_000 });

  // --- Restaurant side: log in, find the reservation, mark picked up ---
  const restaurantCtx = await browser.newContext();
  const restaurantPage = await restaurantCtx.newPage();
  await restaurantPage.goto("/login");
  await restaurantPage.getByLabel(/^email$/i).fill("green@example.com");
  await restaurantPage.getByLabel(/password/i).fill("password123");
  await restaurantPage.getByRole("button", { name: /continue/i }).click();
  await restaurantPage.waitForURL("**/restaurant/dashboard");

  // Go to reservations
  await restaurantPage.getByRole("link", { name: /^reservations$/i }).first().click();
  await restaurantPage.waitForURL("**/restaurant/reservations");
  await expect(restaurantPage.getByRole("heading", { name: /incoming pickups/i })).toBeVisible();

  // Find the row matching the listing we just reserved
  const reservationCard = restaurantPage.locator("div.card", { hasText: cardTitle }).first();
  await expect(reservationCard).toBeVisible({ timeout: 10_000 });
  await reservationCard.getByRole("button", { name: /mark picked up/i }).click();

  // Confirm in the dialog
  await restaurantPage.locator("div.fixed button", { hasText: /^confirm pickup$/i }).first().click();

  // After confirm, the card's status badge should change to picked_up
  await expect(reservationCard.getByText(/picked up/i).first()).toBeVisible({ timeout: 5_000 });

  await customerCtx.close();
  await restaurantCtx.close();
});