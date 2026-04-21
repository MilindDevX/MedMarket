# MedMarket India — Frontend

India's trusted CDSCO-verified medicine marketplace. A React web app with three role-based portals: Consumer, Pharmacy, and Admin.

---

## Quick Start

```bash
cd frontend
npm install
npm run dev
# Open http://localhost:5173
```

---

## Demo Login Credentials

Go to `/login`, select a role — credentials are pre-filled automatically.

| Role | Email | Goes to |
|------|-------|---------|
| Patient | priya@example.com | /consumer/home |
| Pharmacy (Approved) | rajesh@sharmamedical.com | /pharmacy/dashboard |
| Pharmacy (Pending) | sunita@vermamedicals.com | /pharmacy/pending |
| Admin | amit@medmarket.in | /admin/dashboard |

Password for all: `demo1234`

---

## Tech Stack

React 18 + Vite, React Router v7, Zustand, Framer Motion, Recharts, Lucide React, CSS Modules

---

## Project Structure

```
src/
├── App.jsx                    # 40 routes across 4 portals
├── main.jsx                   # Entry + ErrorBoundary
├── styles/tokens.css          # Design tokens (colors, spacing, radius)
├── store/                     # authStore, cartStore, orderStore, toastStore
├── router/guards.jsx          # ConsumerGuard, PharmacyGuard, AdminGuard
├── layouts/                   # PublicLayout, PharmacyLayout, AdminLayout, ConsumerLayout
├── components/ui/             # Badge, Button, KpiCard, Toast, Skeleton, EmptyState, ErrorBoundary
├── pages/
│   ├── public/                # Landing, Login, About, HowItWorks, ForPharmacies
│   ├── pharmacy/              # Register, Pending, Dashboard, Inventory, Orders, Analytics, Pricing, Profile, Notifications
│   ├── admin/                 # Dashboard, Pharmacies, ApplicationReview, Medicines, Orders, Analytics, Complaints, Users, Settings
│   └── consumer/              # Home, Stores, StoreProfile, MedicineBrowse, MedicineDetail, Cart, Checkout, MyOrders, OrderTracking, Profile
├── data/mockData.js           # All mock data
└── utils/usePageTitle.js      # Document title hook
```

---

## Routes

**Consumer** — auth required (`role === consumer`)
- `/consumer/home` Search + nearby stores + quick categories
- `/consumer/medicines` Browse catalogue — URL params: `?search=`, `?category=`
- `/consumer/medicines/:id` Price comparison across stores
- `/consumer/cart` Quantity controls, GST breakdown
- `/consumer/checkout` Address → Payment (UPI/Card/COD) → Confirm
- `/consumer/orders` Live from orderStore
- `/consumer/orders/:id` 5-stage animated tracking

**Pharmacy** — auth required, pending stores redirect to `/pharmacy/pending`
- `/pharmacy/dashboard` KPIs, revenue chart, expiry alerts, demand predictions
- `/pharmacy/inventory` Full table + Add Medicine modal with DPCO validation
- `/pharmacy/inventory/expiry` Grouped alerts: Expired / Critical / Warning
- `/pharmacy/orders` Full lifecycle: New → Accept → Pack → Dispatch → Deliver (with rejection modal)
- `/pharmacy/analytics` Revenue trend, top medicines, demand forecast
- `/pharmacy/pricing` Inline price editor, MRP cap enforced
- `/pharmacy/profile` Store settings + document management

**Admin** — auth required (`role === admin`)
- `/admin/pharmacies` Application list + document review + approve/reject
- `/admin/medicines` Master catalogue CRUD + batch blacklisting
- `/admin/complaints` Split-pane complaint management with resolution workflow
- `/admin/settings` GST, order rules, notification toggles, compliance status

---

## Design Tokens

```css
--green-700: #0C6B4E    /* Primary — Forest Green */
--blue-700:  #1A56DB    /* Trust accent */
--danger:    #EF4444
--warning:   #F59E0B
--success:   #10B981
--font-display: 'Fraunces', serif
--font-body:    'Plus Jakarta Sans', sans-serif
```

---

## Backend Integration

1. Add to `frontend/.env`:
```
VITE_API_BASE_URL=http://localhost:3000/api/v1
```

2. Replace `mockData.js` lookups with API calls per `MedMarket_Backend_Architecture_v1.docx`

3. Key integration note: The cart stores `medicineId` in mock mode. The real backend requires `inventoryId` (specific batch) in the POST `/orders` body.

4. Add axios interceptor: attach JWT on every request, auto-refresh on 401.

---

## Scripts

```bash
npm run dev      # localhost:5173
npm run build    # Production build
npm run preview  # Preview build
npm run lint     # ESLint
```

---

MedMarket India v1.0 · React + Vite · March 2026
