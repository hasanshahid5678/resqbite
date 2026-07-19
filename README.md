# ResQBite

> Marketplace MVP that lets restaurants sell surplus food at discounted prices before closing time. Customers discover listings, reserve with a QR code, and the restaurant verifies pickup.

Built as a full-stack MVP/Proof-of-Concept focusing on clean architecture, intuitive UX, and the complete surplus-food marketplace workflow.

## Tech stack

**Backend** · FastAPI · SQLAlchemy 2 · Pydantic v2 · JWT auth (access + refresh) · PostgreSQL · Alembic · passlib/bcrypt · `qrcode` + Pillow (server-side QR) · pytest

**Frontend** · React 18 (Vite) · TypeScript · Tailwind CSS · React Router 6 · TanStack Query 5 · Axios · Leaflet + OpenStreetMap

**Other** · Docker Compose (dev + prod) · Swagger/OpenAPI auto-docs · Seed script

## Features

### Roles
- **Customer** — browse nearby listings, filter, reserve, get QR code, manage reservations, view profile.
- **Restaurant** — manage profile, create/edit/deactivate listings, view incoming reservations, mark pickups.
- **Admin** — approve/reject restaurants, suspend users, browse listings, dashboard stats.

### Highlights
- Three independent dashboards with sidebar navigation; responsive mobile layout.
- Real-time inventory decrement during reservation via `SELECT … FOR UPDATE` (atomic, prevents overbooking).
- Server-generated QR codes (HMAC-signed token) for pickup verification.
- Lazy on-demand listing expiration (no background worker required).
- Role-based authorization and protected routes (frontend + backend).
- Restaurant approval gate: pending restaurants cannot publish listings.
- Image upload via base64 (≤ 800 KB) — no external storage needed for MVP.
- Leaflet/OpenStreetMap markers on restaurant detail.

## Project structure

```
ResQBite/
├─ docker-compose.yml              prod-style stack
├─ docker-compose.dev.yml          live-reload dev stack
├─ backend/
│  ├─ app/
│  │  ├─ main.py                  FastAPI app + middleware
│  │  ├─ config.py               pydantic-settings
│  │  ├─ database.py             engine + SessionLocal
│  │  ├─ deps.py                 auth deps, role guards, exception handlers
│  │  ├─ models/                 SQLAlchemy ORM (users, restaurants, listings, reservations)
│  │  ├─ schemas/                Pydantic I/O
│  │  ├─ crud/                   DB operations
│  │  ├─ routers/                auth, restaurants, listings, reservations, admin
│  │  ├─ services/                auth_service, qr_service, listing_expiry
│  │  ├─ utils/                  pagination, geo (haversine), exceptions
│  │  └─ scripts/seed.py         sample data
│  ├─ alembic/                   migrations
│  ├─ tests/                      pytest (auth, listings, reservations, admin)
│  └─ requirements.txt
└─ frontend/
   ├─ src/
   │  ├─ api/                     axios clients per module
   │  ├─ components/              UI primitives + layout + MapView + ListingCard
   │  ├─ context/                 AuthContext, ToastContext
   │  ├─ pages/                   public, auth, customer, restaurant, admin
   │  ├─ types/                   shared TS interfaces
   │  └─ lib/                     formatters
   └─ package.json
```

## Quick start (Docker — recommended)

### Production-style
```bash
cp backend/.env.example backend/.env
docker compose up --build
```
- Frontend: http://localhost:8080
- Backend API docs: http://localhost:8000/docs

### Dev (live reload)
```bash
cp backend/.env.example backend/.env
docker compose -f docker-compose.dev.yml up --build
```
- Frontend (Vite): http://localhost:5173
- Backend (uvicorn --reload): http://localhost:8000/docs

After the backend has started, run migrations and seed from inside the container (or use the dev-mount):
```bash
docker compose exec backend alembic upgrade head
docker compose exec backend python -m app.scripts.seed
```

## Local development (without Docker)

### Backend
```bash
cd backend
python -m venv .venv && source .venv/bin/activate
pip install -r requirements.txt

# Provide a Postgres URL (or override DATABASE_URL to sqlite for a quick test)
cp .env.example .env
# Edit .env to point at your local Postgres, or set:
#   DATABASE_URL=sqlite:///./dev.db
#   DATABASE_URL_ASYNC=sqlite+aiosqlite:///./dev.db  (not strictly required for sync app)

alembic upgrade head
python -m app.scripts.seed
uvicorn app.main:app --reload
```

### Frontend
```bash
cd frontend
npm install
npm run dev
```

The Vite dev server proxies `/api` to `http://localhost:8000`, so no CORS tweaks are needed.

## Environment variables

See `backend/.env.example` for the full list. The most important:

| Variable | Default | Description |
|---|---|---|
| `DATABASE_URL` | — | SQLAlchemy sync URL (PostgreSQL recommended) |
| `JWT_SECRET_KEY` | — | HMAC secret for JWT signing |
| `QR_SECRET_KEY` | — | HMAC secret for QR code payload signing |
| `ACCESS_TOKEN_EXPIRE_MINUTES` | 15 | Access token TTL |
| `REFRESH_TOKEN_EXPIRE_DAYS` | 7 | Refresh token TTL (httpOnly cookie) |
| `MAX_IMAGE_BYTES` | 819200 | Max decoded base64 image size |
| `CORS_ORIGINS` | localhost:5173 | Comma/JSON list of allowed origins |

## Database migrations

```bash
cd backend
alembic upgrade head          # apply
alembic revision --autogenerate -m "describe change"   # create new
alembic downgrade -1          # rollback one revision
```

## Seed data

`python -m app.scripts.seed` resets and populates the database with:

- 1 admin, 2 restaurant owners (1 approved, 1 pending), 2 customers
- 2 restaurants with coordinates in Istanbul/Kadıköy
- 6 sample listings (available, sold-out, expired, inactive, etc.)
- 3 reservations across all statuses

**Sample logins** (password `password123` for every account):
- `admin@example.com` — admin
- `green@example.com` — approved restaurant owner
- `pending@example.com` — pending restaurant owner
- `alice@example.com` — customer with reservations
- `bob@example.com` — customer with a pickup

## Tests

### Backend (pytest)
```bash
cd backend
source .venv/bin/activate
# Use a clean env var to ensure tests run on SQLite, not the dev Postgres
env -u DATABASE_URL pytest
```

31 passing + 1 skipped (PostgreSQL-only overbooking test). Covers:
- `test_auth` — register, login (good/bad), `/me`, refresh, logout, duplicate conflict, role-based register
- `test_listings` — pending restaurant can't publish, approved can publish, validation, public list excludes expired/hidden
- `test_reservations` — atomic decrement, overbook conflict, concurrent overbooking (Postgres), cancel restores qty, pickup state transitions, double-pickup blocked
- `test_admin` — stats authz, stats fields, approve restaurant, suspend user + blocked login
- `test_edge_cases` — listing update with active reservations, reservation detail authz, QR-token pickup path, wrong-QR rejection, other restaurant pickup forbidden, admin reject → re-approve, suspended-user auth, expired-listing reservation blocked

### Frontend (Vitest + React Testing Library)
```bash
cd frontend
npm run test
```

39 passing tests across 5 files:
- `format.test.ts` — pure formatter functions (discountPct, formatPrice, formatTime, statusColor, toLocalInputValue)
- `ListingCard.test.tsx` — title/restaurant rendering, discount badge, low-stock warning, link target, distance, sold-out state
- `AuthContext.test.tsx` — boot behaviour when no token, refresh on boot, login/register/logout flows
- `RequireAuth.test.tsx` — redirect to /login when unauthenticated, role gate, spinner during init
- `QuantityStepper.test.tsx` — increment/decrement, boundary clamping, disabled buttons, typing clamp

### End-to-end (Playwright)
Requires the dev Docker stack to be running and freshly seeded:
```bash
docker compose -f docker-compose.dev.yml exec backend python -m app.scripts.seed
cd frontend
npm run test:e2e
```

6 E2E tests (real Chromium) exercising full user journeys:
- Customer can register via UI and lands on their dashboard
- Customer (alice) logs in and reaches dashboard
- Customer reserves a listing and receives the QR confirmation
- Restaurant owner (green) sees fresh reservation and marks it picked up
- Admin approves a freshly-registered pending restaurant
- Admin sees seeded users in the user-management table

## API documentation

FastAPI auto-generates interactive docs at:
- http://localhost:8000/docs — Swagger UI
- http://localhost:8000/redoc — ReDoc

Key endpoints (all prefixed with `/api`):

```
Auth:           /auth/register /auth/login /auth/refresh /auth/logout /auth/me
Restaurants:    GET /restaurants · GET /restaurants/{id} · POST /restaurants · PATCH /restaurants · GET /restaurants/me
Listings:       GET /listings · POST /listings · PUT /listings/{id} · DELETE /listings/{id} · PATCH /listings/{id}/deactivate · GET /listings/me/listings
Reservations:   POST /reservations · GET /reservations/me · GET /reservations/restaurant · GET /reservations/{id} · PATCH /reservations/{id}/pickup · POST /reservations/{id}/cancel
Admin:          GET /admin/stats · GET /admin/restaurants · PATCH /admin/restaurants/{id}/approve|reject · GET /admin/users · PATCH /admin/users/{id}/suspend · GET /admin/listings
```

## Architecture notes

- **Auth**: 15-min access JWT kept in memory by the frontend; 7-day refresh JWT stored in an `httpOnly` cookie scoped to `/api/auth`. Axios interceptor transparently refreshes on 401.
- **Listings expiry**: listings whose `expires_at` has passed automatically become unavailable through query filters. The `status` field is reconciled opportunistically on read, so no cron worker is needed.
- **Concurrency**: reservations run inside a DB transaction with `SELECT … FOR UPDATE` on the listing row. Overbooking is impossible even under concurrent requests (see `test_concurrent_reservations_never_negative`).
- **QR codes**: each reservation stores a `data:image/png;base64,…` PNG rendered server-side. The QR payload is a JWT signed with `QR_SECRET_KEY` containing `rid`, `cid`, `lid`; the restaurant can verify pickup by passing either the reservation ID or the scanned token.
- **Image upload**: images are submitted as base64 data URLs (≤ 800 KB) and stored in `listings.image_data` — no external storage required.
- **Roles**: Restaurant accounts require admin approval (`approval_status = "approved"`) before their listings are visible to customers. Suspended users cannot authenticate.

## Known limitations (MVP scope)

- No reviews, ratings, loyalty, coupons, payments, delivery, push notifications, or social login (per spec).
- Refresh tokens are stateless (no revocation list). Rotate `JWT_SECRET_KEY` to invalidate all sessions.
- Image uploads are limited to 800 KB and stored in the database as base64 — sufficient for an MVP, but for production consider object storage (e.g., S3/Minio).
- Listing expiry is lazy (no scheduled job). An expired listing may briefly appear as `available` in DB until next read; the read path hides them.
- Pickup verification currently accepts either the reservation ID or the QR token; a future mobile scanner would decode the QR and submit the token.
- Tests use SQLite by default; the concurrency test requires PostgreSQL (auto-skipped otherwise).

## License

MIT — provided for the ResQBite MVP challenge.