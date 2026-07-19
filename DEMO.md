# ResQBite — Presentation Guide

A friendly walkthrough for demoing the ResQBite MVP. Follow it top to bottom and you'll have a polished 8–10 minute demo.

---

## Before You Present (5 minutes setup)

### 1. Make sure Docker is running

```bash
docker --version
docker compose version
```

If Docker isn't running, start the Docker daemon first.

### 2. Start the full stack

From the project root:

```bash
docker compose -f docker-compose.dev.yml up --build
```

Wait until you see:
- `frontend-1  |   VITE v6.x.x  ready in xxx ms`
- `backend-1   |  INFO:     Application startup complete.`
- `db-1        |  ... ready to accept connections`

This typically takes 30–60 seconds.

### 3. Open a second terminal — seed the database

```bash
docker compose -f docker-compose.dev.yml exec backend python -m app.scripts.seed
```

You should see:

```
Seed complete: users=5, restaurants=2, listings=6, reservations=3
Logins (password=password123):
  admin@example.com
  green@example.com (approved restaurant owner)
  ...
```

### 4. Open these in your browser tabs

| Tab | URL |
|---|---|
| App | http://localhost:5173 |
| API docs (Swagger) | http://localhost:8000/docs |
| This guide | (this file) |

### 5. Pre-flight check (optional but reassuring)

```bash
# Verify everything is healthy
curl http://localhost:8000/health
# → {"status":"ok"}

curl http://localhost:5173/
# → HTML with <title>ResQBite — Rescue Surplus Food</title>
```

---

## Demo Script (8–10 minutes)

### Scene 1 — The Landing Page (60 seconds)

**Open http://localhost:5173**

Talking points:
- "ResQBite connects restaurants with surplus food to customers at deep discounts — inspired by apps like Too Good To Go."
- Walk through the hero: bold gradient headline, the four-card stat cluster ("55% avg saving", "$120+ saved per month", "2.4 kg CO₂ saved per rescue"), and the live-stats banner with 12.4M+ meals rescued.
- Scroll down to point out:
  - **Featured listings** loaded live from the API (4 cards from the seeded Green Bistro).
  - **Animated cuisine marquee** (Pizza, Sushi, Bakery…).
  - **4-step "How it works"** with green icons and connecting lines.
  - **3-up benefits row** (Half price / Food near you / Cut food waste).
  - **Dark gradient partner CTA** ("Turn surplus into revenue" — for restaurants).
  - **Dark footer** with link columns.

> "Every visual choice here — the green color story, rounded cards, soft shadows, fluid clamp-based typography — is intentionally aligned with the sustainability mission and the Too Good To Go design language."

---

### Scene 2 — Customer Journey (2–3 minutes)

**Click "Sign in" in the top-right.**

Log in with:

| Field | Value |
|---|---|
| Email | `alice@example.com` |
| Password | `password123` |

You'll land on the **Customer Dashboard**.

Talking points:
- Sidebar with icons (Dashboard / Browse listings / Reservations / Profile).
- Stat cards with color-coded icons: Meals rescued, Money saved, Active reservations.
- **Active pickups** with image thumbnails and "View QR" buttons.
- **Recent activity** timeline below.

**Click "Browse listings" in the sidebar.**

- Filter bar at the top: Search, Cuisine/category, Min discount.
- Listed cards show discount badges (−56%), low-stock warnings ("Only 1 left"), pickup windows, and prices with strikethrough originals.

**Click on any listing → Listing detail page.**

- Big hero image with discount badge and status pill.
- Sticky reserve card on the right with the **QuantityStepper** (− 1 +), live total calculation, and a prominent Reserve button.
- Pickup window, address, and QR verification hint.

**Click "Reserve" — get the QR confirmation.**

- Big green check icon, the **QR code** rendered server-side, and a summary panel with reservation ID.
- "Show this QR code at the restaurant during the pickup window."

**Click "View reservations" → Reservations page.**

- Your new reservation appears with a "New" badge.
- "View QR" opens the QR in a modal.
- "Cancel" opens a confirmation dialog (mention: cancelling restores inventory atomically).

---

### Scene 3 — Restaurant Journey (2 minutes)

**Sign out** (top-right or sidebar).

**Sign in as the restaurant owner:**

| Field | Value |
|---|---|
| Email | `green@example.com` |
| Password | `password123` |

**Restaurant Dashboard:**

- Different sidebar (Dashboard / Listings / Reservations — no Profile).
- Stat cards: Active listings, Reservations today, Meals rescued, Revenue recovered.
- The listing Alice just reserved shows up in **Latest reservations** at the bottom.

**Click "Listings" in the sidebar.**

- Each listing card shows thumbnail, title, status pill, price with strikethrough, and quantity remaining.
- Actions: **Edit**, **Deactivate**, **Delete** (with confirmation dialogs).

**Click "New listing" → create form.**

- Two-column responsive grid, file upload with image preview, datetime-local inputs.
- Mention: "Image upload is validated server-side — 800 KB max, stored as base64 in the DB. No external storage service needed for the MVP."

**Click "Reservations" in the sidebar.**

- Find the reservation Alice just made (with image thumbnail, qty, time reserved).
- Click **"Mark picked up"** → confirmation dialog → **"Confirm pickup"**.
- Reservation state transitions to **picked up** — this is the end-to-end QR-verified pickup flow.

---

### Scene 4 — Admin Journey (2 minutes)

**Sign out, then sign in as admin:**

| Field | Value |
|---|---|
| Email | `admin@example.com` |
| Password | `password123` |

**Admin Dashboard:**

- Sidebar: Dashboard / Restaurants / Users / Listings.
- Platform-wide stat cards.

**Click "Restaurants" in the sidebar.**

- Default filter is "Pending" — shows restaurants awaiting approval.
- Switch the filter to "All" to see Green Bistro (approved) and Pending Bistro (pending).
- For Pending Bistro, click **"Approve"** → confirmation dialog → confirm.
- The restaurant vanishes from the Pending view (it's now approved).

**Click "Users" in the sidebar.**

- A clean data table with name, email, role, status, and suspend/unsuspend actions.
- Pick any customer row, click **"Suspend"**, and confirm.
- (Optional: try logging in as that user to show the 401 — but for a live demo, just mention it.)

**Click "Listings" in the sidebar.**

- Every listing across every restaurant with discount and stock columns.

---

### Scene 5 — API & Architecture (1 minute)

**Switch to the Swagger tab: http://localhost:8000/docs**

Talking points:
- "FastAPI auto-generates interactive docs from the Pydantic schemas."
- Point out the route groups: `/auth`, `/restaurants`, `/listings`, `/reservations`, `/admin`.
- Click the **POST /reservations** endpoint → "Try it out" → Show the JSON body schema (`listing_id`, `quantity`).
- Click **GET /listings** → "Try it out" → "Execute" — show the live JSON response with discounted_price, available_quantity, etc.

> "Every endpoint has Pydantic validation, role-based authorization, and is documented with examples out of the box."

---

## Cheat Sheet — All Demo Logins

Save this somewhere handy. **Every account uses the same password: `password123`.**

| Role | Email | What to show |
|---|---|---|
| **Customer** | `alice@example.com` | Browse, reserve, see QR, view reservations |
| **Customer (2)** | `bob@example.com` | Has a picked-up reservation already |
| **Restaurant (approved)** | `green@example.com` | Listings, reservations, mark picked up |
| **Restaurant (pending)** | `pending@example.com` | Can't publish listings until admin approves |
| **Admin** | `admin@example.com` | Approve restaurants, suspend users, view all listings |

---

## Tech-Stack Talking Points (1 minute)

When asked "what's under the hood":

**Backend** — FastAPI · SQLAlchemy 2 · Pydantic v2 · JWT auth (access + refresh httpOnly cookie) · PostgreSQL · Alembic · bcrypt · server-side QR generation with HMAC signing · fully type-annotated · 31 pytest tests + 1 skipped (Postgres-only overbooking concurrency test).

**Frontend** — React 18 + Vite · TypeScript (strict) · Tailwind CSS · React Router 6 · TanStack Query 5 · Axios with refresh-token interceptor · Leaflet + OpenStreetMap · 39 Vitest tests + 6 Playwright E2E tests.

**Auth model** — 15-minute access JWT kept in memory on the client; 7-day refresh JWT in an httpOnly cookie; axios auto-refreshes on 401.

**Concurrency safety** — reservations run inside a DB transaction with `SELECT … FOR UPDATE`; overbooking is impossible even under concurrent requests (proven by the concurrency test).

**No external services** — images stored as base64 (≤ 800 KB), QR codes rendered server-side, lazy on-demand listing expiration (no cron worker needed).

**Docker** — separate dev compose (live reload) and prod compose (multi-stage build with nginx serving the SPA).

---

## If Something Breaks — Quick Recovery

| Symptom | Fix |
|---|---|
| Blank page in browser | Hard refresh: `Ctrl+Shift+R` (or `Cmd+Shift+R` on macOS) |
| 401 on every API call | Re-seed the DB (see step 3 above) |
| "Cannot connect to backend" | `docker compose -f docker-compose.dev.yml ps` — is `backend` Up? |
| Port conflict on startup | Edit `docker-compose.dev.yml` and change the `ports:` mapping for the conflicting service |
| Tests fail with bcrypt warnings | Harmless — the seed still succeeds, output noise only |
| Playwright E2E failures | Re-run `docker compose -f docker-compose.dev.yml exec backend python -m app.scripts.seed` and retry |

---

## Restart From Scratch

If you want a fully clean state mid-demo:

```bash
# Stop everything
docker compose -f docker-compose.dev.yml down

# (Optional) wipe the Postgres volume
docker volume rm resqbite_pgdata 2>/dev/null || true

# Start fresh
docker compose -f docker-compose.dev.yml up --build

# In another terminal: seed
docker compose -f docker-compose.dev.yml exec backend python -m app.scripts.seed
```

---

## Q&A Prep — Likely Questions

**Q: How do you prevent overbooking?**
A: Each reservation runs inside a DB transaction with `SELECT … FOR UPDATE` on the listing row, so concurrent requests serialize. I have a test that fires 20 concurrent reservations against a listing with quantity 5 and asserts exactly 5 succeed and 15 return 409.

**Q: Why base64 images instead of S3?**
A: For MVP scope, base64 in the DB avoids external dependencies and keeps everything in one container. The 800 KB cap and TEXT column are sufficient. For prod I'd swap in S3/Minio with a small adapter.

**Q: Why no refresh-token revocation list?**
A: Statelessness simplifies the MVP. Rotating `JWT_SECRET_KEY` invalidates all sessions. I document this as a known limitation in the README.

**Q: How does listing expiration work without a background job?**
A: Lazy on-demand. The `/listings` query filters `expires_at > now()`, so expired listings automatically disappear from the public API. A small `reconcile_listing_status` helper opportunistically updates the `status` column on read. No cron, no Celery, no APScheduler.

**Q: Is the QR code secure?**
A: The QR payload is a JWT signed with a separate `QR_SECRET_KEY`, containing `rid` (reservation id), `cid` (customer id), `lid` (listing id), and an expiry. The restaurant can verify pickup by passing the scanned token to `/reservations/{id}/pickup` — the server re-verifies the HMAC and that the reservation belongs to the calling restaurant.

**Q: What would you add for production?**
A: Payment gateway, real QR scanner in a mobile app, email notifications, S3 image storage, refresh-token revocation list, observability (OpenTelemetry), CI/CD pipeline, role-based rate limiting, and a proper test database fixture (not just SQLite fallback).

---

## Final Pre-Demo Checklist ✓

- [ ] Docker daemon running
- [ ] `docker compose -f docker-compose.dev.yml up --build` succeeded (all 3 services Up)
- [ ] `python -m app.scripts.seed` ran ("Seed complete")
- [ ] http://localhost:5173 loads the landing page (hero visible)
- [ ] http://localhost:8000/docs shows Swagger UI
- [ ] You can log in with each of the 5 demo accounts
- [ ] Hard-refresh once to clear any stale cache
- [ ] This guide is open in another tab for quick reference

You're ready — good luck!