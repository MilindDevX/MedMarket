# MedMarket Live Walkthrough Findings
**Date:** 2026-08-25 · **Viewport base:** 1440×900 (CLI browser caps at 1280×633 inner) · **Frontend:** http://localhost:5173 · **Backend:** http://localhost:3000

> Status legend: ✅ works · ⚠️ awkward · ❌ broken

---

## 1. Public Pages

### Landing page (`/`)
- ✅ Renders correctly end-to-end: hero, stats bar, problem cards, pharmacy features, 4-step onboarding, CTA, footer. No blank areas.
- ✅ Fonts load: `Plus Jakarta Sans` (body) + `Fraunces` (display), both `loaded` via Google Fonts. No horizontal scroll at 1440px.
- Screenshot: `screenshots/01-landing-full.png`

### Nav links
- ✅ `/how-it-works`, `/for-pharmacies`, `/about` all render real content (initially suspected blank due to a tooling artifact; confirmed populated).

### Footer
- ⚠️ Footer contains **zero hyperlinks** — only static text ("© 2026 MedMarket India…", compliance badges). No sitemap/contact/social links. Functional but unusually dead for a marketplace landing page.

### Login form validation & errors
- ✅ Empty submit → native HTML5 validation ("Please fill out this field.").
- ✅ Wrong password → POST `/api/v1/auth/login` returns **401**, inline error **"Invalid credentials"** displayed next to form. Visible and readable.
  - Screenshot: `screenshots/04-login-wrong-password.png`
- ❌ **BUG (severe):** After several rapid failed logins, the backend rate-limiter (20 req / 10 min per IP — `backend/src/middleware/rateLimit.middleware.ts:12`; CORS preflight OPTIONS requests appear to consume quota too) returns 429. During the burst of failures the login page entered what appeared to be a **runaway re-render loop pegging a renderer process at ~88% CPU**, requiring the browser tab to be killed.
- ⚠️ Once calm, the 429 *is* surfaced correctly as inline text "Too many requests, please try again later" — good — but the rate-limit window (10 min) makes the lockout feel permanent to a real user, and no countdown/retry guidance is given.
- ⚠️ Observed **duplicate POST** to `/api/v1/auth/login` for a single programmatic submit on at least one occasion (two POSTs back-to-back). Needs confirmation but consistent with missing submit-guard.
- ⚠️ Minor automation-relevant quirk: clicking "Sign in" when the button center sits below the viewport fold did nothing (no auto-scroll); may affect short laptop screens.

---

## 0. CRITICAL — Test Credentials Do Not Match Database

Verified directly against the production Postgres DB (`User` table):

| README credential | Reality |
|---|---|
| `milind@medmarket.in` / `Admin@1234` | ❌ Does not exist. Actual admin is **`admin@medmarket.in`** / `Admin@1234` (works) |
| `priya.sharma@gmail.com` / `Consumer@1234` | ❌ Does not exist |
| `rahul.gupta@medplus.in` / `Pharma@1234` | ❌ Does not exist |

- ❌ **All seeded consumer accounts are un-loginable**: `consumer0..9@gmail.com` have placeholder hash `$2a$10$X...` (see `backend/prisma/seed.ts:122`) which matches no password. There is **no valid consumer login** in the seeded database.
- ✅ Pharmacy owners ARE usable: `owner_mumbai@pharma.in` / `Pharma@1234` (owns 2 approved stores).
- ⚠️ README must be regenerated from the actual seed; QA following the README cannot test the consumer flow at all.

**Substitutions used for this walkthrough:** admin → `admin@medmarket.in`; pharmacy → `owner_mumbai@pharma.in`; consumer → registered a fresh account via the live UI (also exercises the signup flow).

---

## 2. Consumer Portal

### Signup (live registration — needed because no consumer login exists)
- ✅ 3-step signup (`/signup`) works end-to-end; auto-login on completion → `/consumer/home`.
- ⚠️ Mobile validation rejects `+919876543210` ("Enter a valid 10-digit Indian mobile number") but accepts bare `9876543210`.

### Home (`/consumer/home`)
- ✅ All sections render: location bar, search hero, category chips, stores row, popular OTC carousel, quick links. No blank areas.
  - Screenshot: `screenshots/05-consumer-home-full.png`
- ❌ **10px category labels** on medicine cards (`_medCategory`: "Allergy", "Respiratory", …) — illegible. **(confirms static claim #2)**
- ⚠️ "Use my location" chip: 12px text, ~29px tap height (below 44px guideline).
- ✅ GPS denial handled gracefully: "Location permission denied. Please type your city manually."
- ⚠️ Location entry has **no autocomplete** — type city, press Enter blind; works after Enter ("2 stores in Mumbai", API `?city=Mumbai`).
  - Screenshot: `screenshots/06-consumer-location-mumbai.png`

### Stores → Store profile
- ⚠️ Store cards are clickable `<div>`s, not links/buttons — no href, poor keyboard/a11y semantics.
- ✅ Store profile renders: verified badge, address/phone, "Available medicines (15)", stock counts, strike-through MRP.
  - Screenshot: `screenshots/07-store-profile.png`
- ❌ Medicine cards inside a store profile **cannot be opened** — no navigation to `/consumer/medicines/:id`; the detail route exists but is unreachable from this page.

### Cart & cross-store behavior
- ⚠️ Adding from browse/detail creates a store-less "Direct" cart that then *blocks checkout* with a warning telling you to re-add items from a store.
- ✅ **REFUTES static claim #3**: a proper **"Switch store?" modal** (`Keep cart` / `Switch store`) appears when adding from another pharmacy — not a silent wipe.
  - Screenshot: `screenshots/10-switch-store-modal.png`
- ❌ **NEW BUG (high): confirming "Switch store?" wipes the cart and adds NOTHING.** Reproduced twice → `items: []`. Root cause (code-read): `confirmSwitch()` calls `clearCart()` then `handleAdd()`, whose stale-closure guard (`StoreProfile.jsx:26`) re-fires `setSwitchWarning` (immediately nulled) instead of adding. Silent total cart data loss.

### Checkout — known bugs
- ❌ **CONFIRMED: "Continue to Payment" with NO address selected goes straight to Payment.** No validation error or hint. Screenshot: `screenshots/12-checkout-no-address.png`
- ⚠️ With UPI selected but empty UPI ID, clicking "Place Order" does nothing silently — no POST, no validation message. Zero user feedback until a UPI ID is typed.
- ✅ **REFUTES double-click duplicate-order bug**: `dblclick` + extra click on "Place Order" produced exactly one `POST /orders` (201); DB shows exactly 2 orders for 2 intentional placements. Button is `disabled={loading}` (`Checkout.jsx:306`).

### Orders & tracking
- ✅ Orders list (Active/Past) renders status chips, items, Cancel buttons. Screenshot: `screenshots/13-consumer-orders.png`
- ✅ Order tracking page: 5-stage tracker renders with live status.
- ✅ Cart badge clears after order placement.

### Search
- ⚠️ Enter navigates to `/consumer/medicines?search=` with correct results ("parac" → 3 medicines), but each search fires **4 identical GET requests** to `/api/v1/medicines?search=…` (no debounce / duplicated effect).

## 3. Pharmacy Portal (`owner_mumbai@pharma.in` — substituted; see §0)

### Login & Dashboard
- ✅ Login works → `/pharmacy/dashboard`. KPIs render: Revenue Today ₹0, Active Orders **25** (11 awaiting acceptance), Expiry Alerts 1, Total SKUs 15. 7-day revenue chart + Active Orders list render.
  - Screenshot: `screenshots/14-pharmacy-dashboard.png`
- ⚠️ New-order rows show buyer as "**QA Auditor9876543210**" — name and phone concatenated with no separator.

### Inventory
- ✅ Table loads: 15 medicines with salt, batch no., expiry, stock, price, status chips, Edit actions. Filter tabs (In Stock / Low / Exp Soon / Exp Critical / Expired) present.
  - Screenshot: `screenshots/15-pharmacy-inventory.png`
- ✅ Expired item correctly flagged ("Dolo 650mg · DOLO-B12 · expired 11d ago").

### Expiry Alerts
- ✅ `/pharmacy/inventory/expiry` renders: 1 expired item, "Remove Stock" action, explainer copy. Screenshot: `screenshots/16-pharmacy-expiry.png`

### Orders queue — Accept / Pack / Dispatch
- ✅ Live queue shows 🔔 NEW ORDER — ACTION REQUIRED banners with Accept/Reject.
- ✅ Full lifecycle executed live on order #34F38888: **New → Accepted → Packing → Dispatched**, each transition reflected instantly.
- ✅ **REFUTES the "Failed to update" double-click bug**: `dblclick` on Accept, Start Packing, and Mark Dispatched each produced exactly **one** `PATCH …/orders/pharmacy/:id/status` (all 200). Zero false errors observed across all three stages.

### Analytics
- ✅ Recharts charts render (312 chart elements): revenue line chart + KPIs (Total ₹48.9k, 169 orders, 88% fulfillment, 43% repeat customers).
  - Screenshot: `screenshots/17-pharmacy-analytics.png`

### Other nav pages
- ✅ Pricing Manager (DPCO MRP caps + discount inputs), Notifications, Complaints, Store Profile all render real content.

### ❌ CRITICAL: Mobile (390px) — portal is unnavigable
- Sidebar/topbar nav is fully hidden at 390px. Visible links on the entire page: **only "View all →"** inside dashboard content. No hamburger, no bottom tabs, no drawer. A pharmacy owner on a phone cannot reach Inventory, Orders, or Analytics AT ALL.
  - Screenshot: `screenshots/24-pharmacy-390.png`

### Topbar dead zones
- ⚠️ Brand "MedMarket | Pharmacy" is not clickable (doesn't return to dashboard); avatar/"Owner Mumbai"/"Your Store" block is inert StaticText with no menu. Nav links themselves all work. **(see claim #4)**

## 4. Admin Portal (`admin@medmarket.in` — substituted; see §0)

### Dashboard
- ✅ Renders: Verified Pharmacies 28 (0 pending), Consumers 152, Orders Today 2 (34 active), Pending Verifications 0, Platform Revenue ₹8.9L, 7-day orders chart, Recent Orders.
  - Screenshot: `screenshots/18-admin-dashboard.png`

### Pharmacies review + document viewer
- ✅ Applications table renders (28 approved) with license numbers, submitted dates, View actions.
- ✅ Pharmacy detail page: store details, drug license/GST numbers, owner block, Approve/Suspend/Edit controls, plus an AI document verification section ("Gemini Vision").
- ⚠️ Document viewer itself could not be exercised: **zero rows exist in `StoreDocument`** for any seeded store ("No documents uploaded yet"). The empty state renders fine, but actual document rendering/approval flow is untested and likely never testable with current seed data.

### Medicines catalogue & Analytics
- ✅ Medicine DB renders (15 CDSCO medicines, category/schedule filters, Add Medicine). Screenshot: `screenshots/20-admin-medicines.png`
- ✅ Analytics renders with Recharts (249 elements): GMV ₹8.9L, 3000 orders, fulfillment 87%, consumer activation 99%. Screenshot: `screenshots/21-admin-analytics.png`

### ❌ CRITICAL: Responsive sidebar (the headline static-audit bug)
| Width | Sidebar state | Hamburger? | Result |
|---|---|---|---|
| 1280px (desktop) | `<aside>` visible, 220px wide | n/a | ✅ normal |
| **768px** | `display:none`, width 0 | **none found** | ❌ **no way to navigate** |
| **390px** | `display:none`, width 0 | **none found** | ❌ no navigation + horizontal scroll |

- At 768px the ONLY interactive elements on the page are content buttons + Logout — no menu trigger exists anywhere in the DOM (`aria-label` scan: zero matches for menu/navigation). Navigation between admin sections is impossible.
- Screenshots: `screenshots/22-admin-768-no-sidebar.png`, `screenshots/23-admin-390-no-sidebar.png`
- At 390px `/admin/analytics` additionally overflows: content width 569px vs 390px viewport → horizontal scrollbar. (Other admin pages fit.)
- Contrast: "0 rejected" red-on-white 12px text ratio 3.76 (AA fail).

## 5. Cross-Cutting Checks

### Text truncation / overflow
- ✅ None observed at 1280px on public/consumer/pharmacy/admin pages except admin analytics at 390px (above).

### Invisible / low-contrast text
- ❌ Consumer cart: "Clear all" red `#EF4444` on cream `rgb(241,240,234)` → ratio **3.30** (AA fail); free-delivery hint is **11px** green ratio 3.77 (double fail). Screenshot: `screenshots/27-cart-contrast-floatbug.png`
- ❌ Consumer home medicine cards: 10px category labels (claim #2).
- ❌ Admin: "0 rejected" 12px red ratio 3.76.
- ✅ General body grays elsewhere sampled ≥ 4.5 — the failures are concentrated in small colored utility text. **(confirms claim #1)**

### Tap targets (390px)
- ❌ Several sub-36px targets on consumer home: "View all" / "Browse all" ≈ **16px tall**, Search icon button 27px, location chip 29px.

### Toasts
- ✅ Toast container occupies only its own 358×44 box at bottom-left (`pointer-events: all` limited to the box) — does NOT blanket-block clicks. Auto-dismisses quickly (~2s default).
- ⚠️ Add-to-cart produces NO toast at all (silent add, badge-only feedback).

### Modal Esc behavior
- ❌ Switch-store modal ignores Escape key entirely (verified: modal still open after Esc). Only backdrop click, X, or action buttons dismiss it. No focus trap observed.

### Focus outlines
- ✅ Keyboard Tab shows visible 2px solid outline via `:focus-visible`.

### Loading states (claim #5)
- ✅ **CONFIRMED inconsistent**: skeleton loaders (`SkeletonCard`/`lnCard`) in StoreProfile, MedicineBrowse, Notifications, AdminAnalytics vs plain-text "Loading…" paragraphs in Checkout (addresses) vs instant-render/no-state elsewhere. Three different patterns for the same concern.

## 6. Static Audit Verification

| # | Claim | Verdict | Evidence |
|---|---|---|---|
| 1 | Warning/success colored text hard to read | **CONFIRMED** | Cart "Clear all" red 3.30:1; free-delivery green 3.77:1 @11px; admin "0 rejected" red 3.76:1 @12px. All below WCAG AA 4.5:1. |
| 2 | 9–10px illegible text on consumer home badges/nav | **CONFIRMED** | `_medCategory` labels measured at exactly **10px** computed font-size ("Pain Relief", "Antacids", …). |
| 3 | Cross-store cart add silently wipes cart without confirmation | **PARTIAL** | The confirmation modal DOES exist ("Switch store?" with Keep cart / Switch store) — not silent. **BUT confirming it wipes the cart and adds nothing** (stale-closure bug, reproduced 2×) — arguably worse than the claimed behavior: explicit confirmation followed by total loss. |
| 4 | Dead topbar in pharmacy layout | **PARTIAL** | All 9 nav links navigate correctly. But brand logo, avatar, store name, and "Your Store" are completely inert (no link home, no profile menu). |
| 5 | Loading inconsistency (skeletons vs plain text vs blank) | **CONFIRMED** | Code + live: `SkeletonCard` (StoreProfile), `lnCard` skeletons (MedicineBrowse, Notifications), plain-text "Loading…" (Checkout addresses), and pages with no loading UI at all. |
| — | Double-click Place Order creates duplicate order (task brief) | **REFUTED** | dblclick + extra click → exactly 1 POST, 1 DB row; button `disabled={loading}` (Checkout.jsx:306). |
| — | Double-click causes "Failed to update" false errors in pharmacy queue (task brief) | **REFUTED** | dblclick on Accept/Pack/Dispatch → single PATCH each, all 200, zero errors. |
| — | Continue to payment without address fails silently (task brief) | **CONFIRMED (opposite failure mode)** | It doesn't fail — it sails through with NO address selected, which is worse: missing validation entirely. |

## Appendix: Screenshot Index
| File | Content |
|---|---|
| 01-landing-full.png | Public landing page, full scroll |
| 02-about-blank.png | (superseded — About page confirmed populated) |
| 03-login.png | Login page with role selector |
| 04-login-wrong-password.png | "Invalid credentials" inline error |
| 05-consumer-home-full.png | Consumer home, all sections |
| 06-consumer-location-mumbai.png | Location set → "2 stores in Mumbai" |
| 07-store-profile.png | Store profile w/ inventory |
| 08-medicine-browse.png | Medicine browse page |
| 09-medicine-detail.png | Medicine detail page |
| 10-switch-store-modal.png | Cross-store switch modal |
| 11-cart.png | Cart with 2 items from one store |
| 12-checkout-no-address.png | Payment step reached with no address |
| 13-consumer-orders.png | Orders list |
| 14-pharmacy-dashboard.png | Pharmacy KPIs + chart |
| 15-pharmacy-inventory.png | Inventory table |
| 16-pharmacy-expiry.png | Expiry alerts page |
| 17-pharmacy-analytics.png | Analytics w/ Recharts |
| 18-admin-dashboard.png | Admin KPIs |
| 19-admin-pharmacy-detail.png | Application detail + doc viewer empty state |
| 20-admin-medicines.png | Medicine DB |
| 21-admin-analytics.png | Platform analytics charts |
| 22-admin-768-no-sidebar.png | **Admin @768 — no nav possible** |
| 23-admin-390-no-sidebar.png | **Admin @390 — no nav + h-scroll** |
| 24-pharmacy-390.png | **Pharmacy @390 — trapped on dashboard** |
| 25-consumer-390-full.png | Consumer home @390 (has hamburger ✅) |
| 26-toast.png | Toast rendering |
| 27-cart-contrast-floatbug.png | Cart contrast + float display bug |

---
### Test Log Notes
- Browser automation: `agent-browser` CLI, isolated session (`AGENT_BROWSER_SESSION=medmarket-audit`). An initial attach to a non-app tab occurred before session pinning; all recorded findings are from the isolated session.
- Auth rate limiting (20 req/10 min, `rateLimit.middleware.ts:12`) was hit during wrong-password testing; CORS preflight OPTIONS requests appear to consume limiter quota (double-counting vs actual login attempts). Worth investigating.

---

> **MERGED:** These findings were merged into `uiux-audit-report.md` (§3 live-verification notes, §11 walkthrough summary, §12 corrections log) and into `frontend-contract-fix-critical-checkout.md` + `frontend-contract-fix-admin-mobile-nav.md` on Aug 25, 2026. This file is retained as the raw evidence record.
