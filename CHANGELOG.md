# Changelog

All notable changes to MedMarket India are documented here.
Format follows [Keep a Changelog](https://keepachangelog.com/en/1.1.0/).

---

## [Unreleased]

### Added
- **BullMQ + Redis job queue** — nightly expiry notification pipeline (`ExpiryNotificationJob`)
  - `src/config/redis.ts` — Redis connection factory; supports local (`redis://`) and Upstash TLS (`rediss://`); gracefully disabled when `REDIS_URL` is unset
  - `src/queues/expiry.queue.ts` — BullMQ `Queue` + `Worker` bootstrap with retry (3× exponential back-off) and graceful shutdown hooks
  - `src/queues/expiry.processor.ts` — pure business logic (testable without Redis): scans active inventory expiring within 60 days, groups by pharmacy owner, de-duplicates (one notification per owner per day), creates batched `in_app` Notification rows
  - `src/queues/expiry.scheduler.ts` — repeatable cron schedule (02:00 IST / 20:30 UTC) persisted in Redis; `scheduleExpiryJobNow()` for manual/demo triggers
  - `src/controllers/queue.controller.ts` — admin endpoints: `POST /admin/jobs/expiry/trigger` (enqueue immediately) and `GET /admin/jobs/expiry/status` (queue depth + next run)
  - `bullmq ^5` added to `package.json`
  - `REDIS_URL` added to `.env.example` (optional — queue silently disabled when absent)
  - `docker-compose.yml` — `redis:7-alpine` service added; backend `REDIS_URL` wired automatically
  - Graceful `SIGTERM` / `SIGINT` shutdown in `index.ts` closes worker and disconnects Prisma cleanly
- `Dockerfile` + `.dockerignore` for backend — multi-stage Node 20 Alpine build
- `docker-compose.yml` — wires PostgreSQL 16 + backend with health checks
- OpenAPI 3.0 spec at `/api/docs` (Swagger UI) and `/api/docs.json`
- Demo Credentials banner on Landing page — one-click copy for all three roles
- CI pipeline: separate backend + frontend jobs with typecheck, lint, and coverage steps
- `CONTRIBUTING.md` — setup guide, branch naming, PR checklist
- `CHANGELOG.md` (this file)

### Fixed
- **Auth:** `doNavigate` in `Login.jsx` now handles `pharmacyStatus === null` — existing Google OAuth pharmacy owners no longer crash the dashboard on first login
- **Pagination:** `AdminPharmacies` page size corrected 15 → 20
- **Pagination:** `AdminOrders` page size corrected 20 → 25
- **Pagination:** `MyOrders` — pagination now applies to the `past` tab only; `active` tab shows all in-progress orders without paging; page resets on tab switch
- **Pagination:** `AdminMedicines` — pagination added (was missing entirely); 20 per page; resets on filter/search change

### Changed
- **Admin Analytics:** replaced single-pharmacy dropdown with a two-tab layout (Platform Overview | Pharmacy Breakdown)
- **Admin Analytics — Pharmacy Breakdown:** sortable table of all approved stores with columns: Store Name, City, Orders, GMV, Fulfillment %, Avg Order Value, Last Active — computed locally from already-loaded data (no extra API call)
- **Admin Analytics:** removed dependency on `usePharmacyAnalytics` hook from the analytics page

---

## [1.0.0] — 2026-03-22

### Added
- Consumer portal: GPS-aware store discovery, medicine browse, cart, checkout, order tracking, complaint filing
- Pharmacy dashboard: multi-step registration, document upload, inventory management (OTC only, MRP enforcement, batch tracking), order queue, analytics, expiry alerts
- Admin panel: pharmacy application review, master medicine catalogue, platform analytics, complaint management, audit log, platform settings
- Authentication: JWT access (15 min) + refresh (7 days) with rotation, Google OAuth, OTP tokens
- PostgreSQL `CHECK` constraint enforcing `selling_price ≤ MRP` at the database level (DPCO compliance)
- Automated expiry alerts at 60-day (warning) and 30-day (critical) thresholds; dead stock detection at 45 days of no sales
- Batch blacklisting (CDSCO recall simulation) — hides affected stock platform-wide instantly
- Rate limiting (`express-rate-limit`) on all auth routes
- Security hardening: `helmet.js`, CORS whitelist, Morgan request logging
- GitHub Actions CI (basic test run)
- Render deployment configuration (`render.yaml`) including self-ping cron to keep the free-tier service warm
- 38 backend unit tests (Vitest + Supertest)
- 20 frontend unit tests (Vitest + Testing Library)
- Realistic seed data: 4 pharmacies, 3 consumers, 30 OTC medicines, 9 orders across every status
