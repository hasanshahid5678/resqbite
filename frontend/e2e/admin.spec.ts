import { expect, test } from "@playwright/test";

/**
 * E2E scenario #4 — admin approves a pending restaurant.
 *
 * Creates a fresh pending restaurant by registering a new restaurant owner
 * via the API (which creates a pending profile automatically when restaurant
 * owner signs up), then signs in as admin and approves it via the UI.
 */
test("admin can approve a pending restaurant", async ({ page, request }) => {
  const ts = Date.now();
  const ownerEmail = `pending_owner_${ts}@example.com`;
  const restaurantName = `Pending Test Bistro ${ts}`;

  // 1. Register a new restaurant owner with a fresh profile (pending state)
  await request.post("http://localhost:8000/api/auth/register", {
    data: { name: "Pending Owner", email: ownerEmail, password: "password123", role: "restaurant" },
  });
  const loginRes = await request.post("http://localhost:8000/api/auth/login", {
    data: { email: ownerEmail, password: "password123" },
  });
  const ownerToken = (await loginRes.json()).access_token;
  await request.post("http://localhost:8000/api/restaurants", {
    headers: { Authorization: `Bearer ${ownerToken}` },
    data: {
      name: restaurantName,
      description: "Awaiting approval",
      address: "Test Cad. 100",
      latitude: 40.962,
      longitude: 29.06,
      cuisine: "Mediterranean",
      opening_time: "10:00",
      closing_time: "22:00",
    },
  });

  // 2. Sign in as admin via UI
  await page.goto("/login");
  await page.getByLabel(/^email$/i).fill("admin@example.com");
  await page.getByLabel(/password/i).fill("password123");
  await page.getByRole("button", { name: /continue/i }).click();
  await page.waitForURL("**/admin/dashboard");

  // 3. Navigate to Restaurants page (default filter is "Pending")
  await page.getByRole("link", { name: /^restaurants$/i }).first().click();
  await page.waitForURL("**/admin/restaurants");
  await expect(page.getByRole("heading", { name: /manage restaurants/i })).toBeVisible();

  // 4. Locate the card for our freshly-created pending restaurant
  const pendingCard = page.locator("div.card", { hasText: restaurantName }).first();
  await expect(pendingCard).toBeVisible({ timeout: 15_000 });

  // 5. Click Approve in the card to open the confirm dialog
  await pendingCard.getByRole("button", { name: /^approve$/i }).click();

  // 6. Wait for the modal to appear with the "Approving lets" message
  await expect(page.getByText(/Approving lets the restaurant publish listings/i)).toBeVisible({
    timeout: 5_000,
  });

  // 7. Confirm: click the Approve button in the modal by chaining with the modal text
  await page.locator("div.fixed", { hasText: /Approving lets the restaurant publish listings/i })
    .getByRole("button", { name: /^approve$/i })
    .click();

  // 8. Wait for the success toast
  await expect(page.getByText(/Restaurant approved/i)).toBeVisible({ timeout: 10_000 });

  // 9. After approval the restaurant moves out of the "Pending" filter view,
  //    so switching to the "Approved" tab verifies the operation persisted.
  await page.locator("select#status").selectOption("approved");
  // Wait for the new filter to load and the approved restaurant to appear
  await expect(page.locator("div.card", { hasText: restaurantName }).first()).toBeVisible({
    timeout: 10_000,
  });
});

test("admin can list users and see seeded alice", async ({ page }) => {
  await page.goto("/login");
  await page.getByLabel(/^email$/i).fill("admin@example.com");
  await page.getByLabel(/password/i).fill("password123");
  await page.getByRole("button", { name: /continue/i }).click();
  await page.waitForURL("**/admin/dashboard");

  await page.getByRole("link", { name: /^users$/i }).first().click();
  await page.waitForURL("**/admin/users");
  await expect(page.getByRole("heading", { name: /all users/i })).toBeVisible();
  await expect(page.getByText("alice@example.com")).toBeVisible();
});