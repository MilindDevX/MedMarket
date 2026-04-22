# MedMarket India

> A location-aware, multi-sided digital marketplace connecting verified pharmacies with consumers across India — built for regulatory compliance under the Drugs & Cosmetics Act, CDSCO guidelines, and Drug Price Control Order (DPCO).

---

## Table of Contents

- [Overview](#overview)
- [Architecture](#architecture)
- [Tech Stack](#tech-stack)
- [Portals](#portals)
- [Getting Started](#getting-started)
- [Environment Variables](#environment-variables)
- [Database Setup](#database-setup)
- [Deployment on Render](#deployment-on-render)
- [Project Structure](#project-structure)
- [API Overview](#api-overview)
- [Regulatory Compliance](#regulatory-compliance)
- [Test Credentials](#test-credentials)

---

## Overview

MedMarket India solves three structural problems in the Indian OTC medicine retail market:

| Problem | How MedMarket solves it |
|---|---|
| Counterfeit and unverified medicines | Only CDSCO-registered pharmacies with verified Drug Licenses can list medicines |
| Price opacity and MRP violations | DPCO enforcement via PostgreSQL CHECK constraint — selling price ≤ MRP is guaranteed at the database level |
| Expiry losses and dead stock | Automated tiered alerts at 60 days, 30 days, and 0 days; dead stock detection after 45 days of no sales |

The platform has three distinct portals — Consumer, Pharmacy, and Admin — each with its own authentication path, color scheme, and permission scope.

---

## Architecture

```
┌─────────────────────────────────────────────┐
│              Client Layer (React SPA)        │
│  Consumer Portal  │  Pharmacy Dashboard  │  Admin Panel  │
└───────────────────┬─────────────────────────┘
                    │ HTTPS / JWT Bearer
┌───────────────────▼─────────────────────────┐
│         Express REST API  (/api/v1/*)        │
│  Auth middleware → Role guard → Zod validate │
│  Controllers → Services → Repositories       │
└──────┬────────────────────────┬──────────────┘
       │                        │
┌──────▼──────┐          ┌──────▼──────┐
│ PostgreSQL  │          │  Cloudinary │
│  (Prisma)   │          │ (documents) │
└─────────────┘          └─────────────┘
```

**Request flow:**
1. Client sends `Authorization: Bearer <token>` with every authenticated request
2. `authenticate` middleware verifies JWT, attaches `req.userId` and `req.role`
3. `requireRole(...)` guard checks the role against the route's requirements
4. Zod middleware validates request body/params against schema
5. Controller calls service → repository → Prisma query
6. Response is returned with a consistent `{ success, data, message }` envelope

---

## Tech Stack

### Backend

| Layer | Technology |
|---|---|
| Runtime | Node.js 20 LTS |
| Framework | Express.js 5 |
| Language | TypeScript 5 |
| ORM | Prisma 7 with `@prisma/adapter-pg` |
| Database | PostgreSQL 16 |
| Auth | JWT (access 15 min + refresh 7 days with rotation) |
| File storage | Cloudinary |
| Build | esbuild (not tsc — see [Why esbuild](#why-esbuild)) |
| Testing | Vitest + Supertest (38 tests) |

### Frontend

| Layer | Technology |
|---|---|
| Framework | React 19 |
| Routing | React Router v7 |
| State | Zustand |
| Styling | CSS Modules + design tokens |
| Charts | Recharts |
| Animations | Framer Motion |
| HTTP client | Fetch API with JWT refresh interceptor |
| Testing | Vitest + Testing Library (20 tests) |

---

## Portals

### Consumer Portal (`/consumer/*`)
- GPS location detection via `navigator.geolocation` + OpenStreetMap Nominatim reverse-geocoding (no API key required)
- Store discovery filtered by city across verified pharmacies
- Medicine browse with price comparison across multiple stores
- Full order lifecycle: place → track (5 stages) → cancel
- Complaint filing with order-status-aware type filtering

### Pharmacy Dashboard (`/pharmacy/*`)
- Multi-step store registration with document upload (Drug License, GST certificate, store photos)
- Inventory management with batch-level tracking, MRP enforcement, and OTC-only constraint
- Order queue: accept / reject / pack / dispatch / deliver
- Analytics: 14-day revenue trend, hourly order heatmap, top medicines, fulfillment/rejection/repeat-customer rates, dead stock value at risk
- Expiry alerts at 60-day (warning) and 30-day (critical) with dead stock detection at 45 days

### Admin Panel (`/admin/*`)
- Pharmacy application review with document viewer and verification checklist
- Approve / reject / suspend / reactivate pharmacies
- Master medicine catalogue management (add, edit, deactivate, blacklist batches)
- Platform-wide analytics: GMV trend, city-wise order heatmap, top medicines, consumer activation rate, pharmacy approval turnaround time
- Complaint management and audit log

---

## Getting Started

### Prerequisites

- Node.js 20+
- PostgreSQL 16
- A Cloudinary account (free tier is fine for development)

### 1. Clone and install

```bash
# Backend
cd backend
npm install

# Frontend
cd ../frontend
npm install
```

### 2. Configure environment

```bash
# backend/.env  (copy from .env.example)
cp backend/.env.example backend/.env
```

Edit `backend/.env` with your values — see [Environment Variables](#environment-variables).

### 3. Set up the database

```bash
cd backend

# Run all migrations
npx prisma migrate deploy

# Generate the Prisma client
npx prisma generate

# Seed with realistic sample data
npm run db:seed
```

### 4. Run in development

```bash
# Terminal 1 — Backend (hot reload)
cd backend && npm run dev

# Terminal 2 — Frontend (Vite HMR)
cd frontend && npm run dev
```

Backend runs on `http://localhost:3000`, frontend on `http://localhost:5173`.

---

## Environment Variables

All sensitive values go in `backend/.env`. Never commit this file.

| Variable | Example | Description |
|---|---|---|
| `DATABASE_URL` | `postgresql://user:pass@localhost:5432/medmarket` | Prisma connection string |
| `JWT_ACCESS_SECRET` | (32+ random chars) | Signs 15-minute access tokens |
| `JWT_REFRESH_SECRET` | (32+ random chars, different from above) | Signs 7-day refresh tokens |
| `PORT` | `3000` | API server port |
| `FRONTEND_URL` | `http://localhost:5173` | CORS whitelist origin |
| `CLOUDINARY_CLOUD_NAME` | `your_cloud` | Cloudinary document storage |
| `CLOUDINARY_API_KEY` | `123456789` | Cloudinary API key |
| `CLOUDINARY_API_SECRET` | `abc123...` | Cloudinary API secret |

Generate strong secrets with:
```bash
node -e "console.log(require('crypto').randomBytes(48).toString('hex'))"
```

---

## Database Setup

### Running migrations

```bash
npx prisma migrate deploy   # production-safe, applies pending migrations
npx prisma migrate dev       # development only, creates new migrations
```

### Seeding

The seed file (`prisma/seed.ts`) creates a full realistic dataset:

```bash
npm run db:seed
```

**What gets created:**
- 1 admin (Milind Rao)
- 3 consumers with saved addresses
- 4 pharmacy stores (2 approved, 1 pending, 1 rejected)
- 30 real OTC medicines (Crocin, Dolo, Combiflam, Pan-D, Allegra, etc.)
- ~18 inventory items per approved store with batch numbers
- 9 orders covering every status: delivered, dispatched, packing, accepted, confirmed, rejected, cancelled
- Near-expiry batches, dead stock items, 1 blacklisted batch (CDSCO recall)
- Notifications, complaints, and audit logs

See [Test Credentials](#test-credentials) for login details.

---

## Deployment on Render

### Backend (Web Service)

| Setting | Value |
|---|---|
| **Environment** | Node |
| **Build command** | `npm install && npm run build` |
| **Start command** | `npm start` |
| **Node version** | 20 |

**Environment variables** — add all values from `.env.example` in the Render dashboard under Environment → Environment Variables.

> **Important:** Add `DATABASE_URL` pointing to your Render PostgreSQL instance (or external DB). Render provides this automatically if you attach a PostgreSQL database to the service.

**Post-deploy:** Run migrations once via Render Shell or add to build command:
```bash
# Add to Build command if you want auto-migration:
npm install && npx prisma migrate deploy && npm run build
```

### Frontend (Static Site)

| Setting | Value |
|---|---|
| **Build command** | `npm install && npm run build` |
| **Publish directory** | `dist` |

**Environment variables:**

| Variable | Value |
|---|---|
| `VITE_API_URL` | `https://your-backend.onrender.com/api/v1` |

---

## Why esbuild?

The codebase imports TypeScript files with `.ts` extensions (e.g. `import './config/env.ts'`). This is valid for `tsx` (the dev runner) and `esbuild`, but **incompatible with `tsc` emit mode** — `tsc` requires extensions to be `.js` in output-targeting mode, causing `TS5097` errors.

`esbuild` strips types and resolves extensions natively, producing a working `dist/index.js` in under a second. Run `npm run typecheck` locally for type safety checks.

---

## Project Structure

```
backend/
├── prisma/
│   ├── schema.prisma          # Full data model
│   ├── migrations/            # SQL migration history
│   └── seed.ts                # Realistic seed data
├── src/
│   ├── config/                # Prisma client, env validation
│   ├── controllers/           # HTTP handlers (thin — no business logic)
│   │   ├── auth.controller.ts
│   │   ├── admin.controller.ts
│   │   ├── dashboard.controller.ts
│   │   ├── inventory.controller.ts
│   │   ├── order.controller.ts
│   │   ├── settings.controller.ts
│   │   └── ...
│   ├── middleware/            # Auth, role guards, rate limiting, validation
│   ├── routes/                # Express routers
│   ├── types/                 # Express request augmentation
│   ├── utils/                 # JWT, bcrypt, response helpers
│   └── __tests__/             # Vitest unit tests (38 tests)
├── esbuild.config.mjs         # Production build (not tsc)
├── vitest.config.ts
└── package.json

frontend/
├── src/
│   ├── components/
│   │   ├── consumer/          # ConsumerNav (with live city from locationStore)
│   │   └── ui/                # Shared: Button, Badge, Skeleton, Toast, etc.
│   ├── hooks/                 # Data-fetching hooks (useOrders, useInventory, etc.)
│   ├── layouts/               # AdminLayout, PharmacyLayout, ConsumerLayout
│   ├── pages/
│   │   ├── admin/             # Dashboard, Pharmacies, Medicines, Analytics, Settings
│   │   ├── consumer/          # Home, Stores, Medicines, Cart, Checkout, Orders
│   │   ├── pharmacy/          # Dashboard, Inventory, Orders, Analytics, Pricing
│   │   └── public/            # Landing, Login, Register, How It Works
│   ├── router/                # Route guards (ConsumerGuard, PharmacyGuard, AdminGuard)
│   ├── store/                 # Zustand stores: auth, cart, location, order, toast
│   ├── styles/                # Design tokens (CSS vars), global styles
│   └── __tests__/             # Vitest + Testing Library (20 tests)
├── vitest.config.js
└── package.json
```

---

## API Overview

All routes are prefixed with `/api/v1`. Authentication uses `Authorization: Bearer <token>`.

### Authentication — `/auth`

| Method | Route | Auth | Description |
|---|---|---|---|
| POST | `/auth/register` | Public | Create consumer or pharmacy_owner account |
| POST | `/auth/login` | Public | Login, returns access + refresh tokens |
| POST | `/auth/refresh` | Refresh token | Rotate refresh token, issue new access token |
| POST | `/auth/logout` | JWT | Revoke refresh token |

### Consumer — `/consumer`

| Method | Route | Description |
|---|---|---|
| GET | `/stores?city=Delhi` | List approved stores filtered by city |
| GET | `/stores/:id` | Full store profile with inventory |
| GET | `/medicines` | Browse OTC medicine catalogue |
| GET/POST/PATCH/DELETE | `/consumer/addresses` | Saved delivery addresses |

### Orders — `/orders`

| Method | Route | Auth | Description |
|---|---|---|---|
| POST | `/orders` | Consumer | Place order (transactional stock deduction) |
| GET | `/orders/my` | Consumer | List own orders |
| POST | `/orders/my/:id/cancel` | Consumer | Cancel confirmed order (restores stock) |
| GET | `/orders/pharmacy` | Pharmacy | Incoming orders for the store |
| PATCH | `/orders/pharmacy/:id/status` | Pharmacy | Accept / reject / pack / dispatch / deliver |

### Pharmacy — `/pharmacy`

| Method | Route | Description |
|---|---|---|
| POST | `/pharmacy/register` | Register store (creates pending application) |
| POST | `/pharmacy/documents` | Upload documents to Cloudinary |
| GET/PUT | `/pharmacy/profile` | Store profile |
| GET/POST/PUT/DELETE | `/pharmacy/inventory` | Inventory CRUD |
| GET | `/pharmacy/inventory/expiry-alerts` | Items expiring within 60 days |

### Admin — `/admin`

| Method | Route | Description |
|---|---|---|
| GET | `/admin/dashboard` | Platform KPIs |
| GET/PATCH | `/admin/settings` | Platform-wide settings (GST %, COD limit, etc.) |
| GET | `/admin/applications` | All pharmacy applications |
| PATCH | `/admin/applications/:id/approve` | Approve pharmacy |
| PATCH | `/admin/applications/:id/reject` | Reject with reason |
| PATCH | `/admin/applications/:id/suspend` | Suspend active pharmacy |
| GET/POST/PATCH/DELETE | `/admin/medicines` | Master medicine catalogue |
| POST | `/admin/medicines/:id/blacklist-batch` | Blacklist a batch platform-wide |

### Response envelope

Every response follows:
```json
{ "success": true, "message": "...", "data": { ... } }
{ "success": false, "message": "...", "errors": [...] }
```

---

## Regulatory Compliance

| Regulation | Technical enforcement |
|---|---|
| **Drugs & Cosmetics Act 1940** | Drug License required before pharmacy goes live; Admin must approve |
| **CDSCO medicine registration** | Only Admin-managed medicines in master catalogue; Schedule H/H1/X blocked in Phase 1 |
| **DPCO price cap** | PostgreSQL `CHECK` constraint: `selling_price ≤ MRP` — cannot be bypassed even with direct DB access |
| **GST compliance** | 12% applied on every order subtotal; invoice auto-generated on delivery |
| **Consumer Protection Act 2019** | Rejection requires mandatory reason; full audit log of all admin actions |
| **Batch traceability** | Batch number mandatory on every inventory entry; `order_items` snapshot batch at order time |
| **Real-time recall** | `blacklisted_batches` table hides affected stock platform-wide instantly |

---

## Test Credentials

After running `npm run db:seed`:

### Admin
| Field | Value |
|---|---|
| Email | `milind@medmarket.in` |
| Password | `Admin@1234` |

### Consumers (password: `Consumer@1234`)
| Name | Email |
|---|---|
| Priya Sharma | `priya.sharma@gmail.com` |
| Arjun Mehta | `arjun.mehta@gmail.com` |
| Sneha Kulkarni | `sneha.kulkarni@gmail.com` |

### Pharmacy Owners (password: `Pharma@1234`)
| Name | Email | Status | City |
|---|---|---|---|
| Rahul Gupta | `rahul.gupta@medplus.in` | ✅ Approved | Delhi |
| Fatima Sheikh | `fatima.sheikh@healthcure.in` | ✅ Approved | Pune |
| Vikram Nair | `vikram.nair@apollo.in` | ⏳ Pending | Bengaluru |
| Deepa Joshi | `deepa.joshi@jantapharma.in` | ❌ Rejected | Nagpur |

---

## Running Tests

```bash
# Backend — 38 unit tests
cd backend && npm test

# Frontend — 20 unit tests
cd frontend && npm test

# With coverage
cd backend && npm run test:coverage
cd frontend && npm run test:coverage
```

Tests cover: auth (register/login/refresh/logout), inventory (OTC enforcement, MRP cap, Schedule H/H1/X blocking), order rules (COD limit, stock validation, state machine), platform settings, cart store (add/remove/qty/cross-store switch), API client (401 refresh, auth bypass, logout dispatch).

---

## Health Check

```
GET /health
```

Returns:
```json
{ "status": "ok", "timestamp": "2026-04-22T10:00:00.000Z", "service": "MedMarket API", "version": "1.0.0" }
```

---

*MedMarket India — Confidential | v1.0 | March 2026*
