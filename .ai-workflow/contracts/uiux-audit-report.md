# MedMarket India — UI/UX & Workflow Quality Audit

**Date:** August 25, 2026
**Scope:** React 19 + Vite frontend (`frontend/`)
**Status:** ✅ **COMPLETE** — Static audit + live browser walkthrough executed Aug 25, 2026. See [Section 11](#11-live-browser-walkthrough) and the [Corrections Log](#12-corrections-log). Several static claims were revised after live verification.

---

## Table of Contents

1. [Executive Summary](#1-executive-summary)
2. [Methodology](#2-methodology)
3. [Critical Findings (P0)](#3-critical-findings-p0)
4. [High Findings (P1)](#4-high-findings-p1)
5. [Medium Findings (P2)](#5-medium-findings-p2)
6. [What Works Well](#6-what-works-well)
7. [Route/Page Inventory](#7-routepage-inventory)
8. [Missing Screens](#8-missing-screens)
9. [Quantified Drift Summary](#9-quantified-drift-summary)
10. [Prioritized Recommendations](#10-prioritized-recommendations)
11. [Live Browser Walkthrough](#11-live-browser-walkthrough)
12. [Corrections Log](#12-corrections-log)

---

## 1. Executive Summary

MedMarket India is an **intentionally designed application**, not a template job. The design language — Fraunces serif display type paired with Plus Jakarta Sans body text, a warm neutral canvas (`#F1F0EA`), and a real design-token system with **~93% `var()` adoption (2,206 token usages)** — demonstrates genuine design engineering investment. Empty states are polished, the GPS-denied location flow is exemplary in its per-error-code messaging, and route guards with role/status gating are correctly implemented.

However, the audit surfaced two systemic weaknesses:

1. **Systemization drift** — the token system exists but is not enforced. 164 hardcoded hexes, 1,541 raw pixel values, 19 ad-hoc font sizes, zero typography tokens, and ~90% duplicated sidebar/layout code across portals show the system decaying under delivery pressure.
2. **Checkout-flow integrity** — the highest-value funnel in the product contains **multiple P0 defects that will lose real orders**: address-less order placement, silent payment failures, and cart-destroying store-switch behavior. *(Live walkthrough revised the original four — duplicate-order submission was refuted; see §3 and §12.)*

### Verdict

| Dimension | Rating | Notes |
| :--- | :--- | :--- |
| Visual design quality | ★★★★☆ | Strong identity; drift at the edges |
| Design system maturity | ★★★☆☆ | Real tokens, no enforcement layer |
| Checkout integrity | ★★☆☆☆ | 4 critical bugs lose orders |
| Accessibility | ★★☆☆☆ | Contrast failures, no reduced-motion, invisible toasts |
| Architecture / IA | ★★★★☆ | Clean routing & role gating |
| Resilience / error UX | ★★★☆☆ | Good patterns exist but inconsistently applied |

**Overall: Ship-blocker on checkout. Strong foundation worth protecting.** The four P0 findings must be fixed before any revenue-generating traffic.

---

## 2. Methodology

This audit was conducted via **three parallel static analysis tracks** against the React 19 + Vite frontend located at `frontend/`:

| Track | Focus | Artifacts Examined |
| :--- | :--- | :--- |
| **Track A — Structural UX** | Routing, information architecture, navigation hierarchy, role gating, page inventory, missing screens, dead-end states | Router config, layout components, guard implementations, portal shells |
| **Track B — Design System & Visual Quality** | Token adoption, color/contrast compliance, typography scale, spacing consistency, component API consistency, duplication between portals | `tokens.css`, all `*.module.css`, shared components, inline style usage |
| **Track C — Chaos UX / Edge Cases** | Failure paths: expired tokens, GPS denial, empty carts, stock exhaustion, double submits, network errors, screen-reader exposure of transient state, reduced-motion, keyboard access | Store logic, hooks, API interceptors, toast/modal systems, form flows |

**Stack context:** React 19 + Vite, Zustand stores (`authStore`, `cartStore`, etc.), CSS Modules with a central token file (`tokens.css`), Tailwind present as fallback utility layer.

A **live browser walkthrough** (Section 11) was executed on Aug 25, 2026 and validated/corrected the static findings — see the Corrections Log (Section 12).

---

## 3. Critical Findings (P0)

> Each P0 either **loses real customer orders**, makes the admin portal unusable on common hardware, or violates WCAG AA legally-binding contrast thresholds.

| # | Finding | File References | Impact |
| :--- | :--- | :--- | :--- |
| P0-1 | **Order placeable with NO delivery address.** The step gate does not validate that a `selectedAddr` exists before allowing "Place Order". A user who skipped or cleared the address step can submit an unfulfillable order. | `Checkout.jsx:94` (step gate), `Checkout.jsx:236` (submit path) | Orders arrive without destination → fulfillment failure, refunds, support load |
| P0-2 | **Out-of-stock item dead-ends checkout.** `cartStore.js` snapshots `availableQty` at add-to-cart time and **never revalidates** against server stock. At checkout, failure surfaces only as a generic toast with no remediation path (no quantity clamp, no item removal prompt). | `cartStore.js:41` (stale snapshot), `Checkout.jsx:104` (generic error toast) | User blocked from entire checkout due to one stale line item; abandoned carts |
| ~~P0-3~~ | **WITHDRAWN after live testing** — duplicate order submission was NOT reproducible: Place Order button disables correctly during submit; a live double-click produced exactly one POST/one DB row. Idempotency key retained as defense-in-depth recommendation (now P2). See §12 Corrections Log. | `Checkout.jsx:87`, `Checkout.jsx:306` | n/a — refuted |
| P0-4 | **Admin portal unnavigable below 900px.** Admin sidebar is `display:none` below the breakpoint with **no drawer/hamburger fallback** — unlike the Pharmacy portal which implements one. Admins on laptops with split screens or small windows cannot reach any nav destination. *(Live: CONFIRMED AND WORSE — see below.)* | `AdminLayout.module.css:163–167` | Complete admin workflow lockout on sub-900px viewports |
| P0-5 | **WCAG AA text contrast failures.** `--warning #D97706` yields **3.19:1** and `--success #059669` yields **3.77:1** on white — both fail the 4.5:1 AA threshold for normal text. Both tokens are used directly as text colors (e.g., ConsumerHome `.openBadge`). | `tokens.css:24` (`--warning`), `tokens.css:27` (`--success`); usage e.g. `ConsumerHome` `.openBadge` | Legal accessibility exposure; unreadable status text for low-vision users |
| P0-6 | **Zero `prefers-reduced-motion` support.** The app ships 136 motion-bearing elements across 52 files with no reduced-motion media query anywhere. Vestibular-disorder users receive full animation intensity with no opt-out. | App-wide (136 motion elements / 52 files) | WCAG 2.3.3 violation; accessibility barrier for motion-sensitive users |

### Live Verification Notes (Aug 25, 2026 walkthrough)

- **P0-1 Missing-address checkout bug: CONFIRMED live.** "Continue to Payment" sails through with zero address selected — no validation error, no hint (`screenshots/12-checkout-no-address.png`). The failure mode is worse than static analysis implied: it isn't a silent *failure*, it's missing validation entirely.
- **NEW CRITICAL (P0): Empty/UPI payment Place Order fails 100% SILENTLY.** With UPI selected but an empty UPI ID, clicking "Place Order" does nothing — no POST fires, no toast, no inline field error. The button is simply inert with zero feedback until the user guesses that a UPI ID is required. Every validation early-return in `handlePlaceOrder` must surface feedback.
- **P0-3 Duplicate-order double-click bug: REFUTED live.** Double-click + extra click on "Place Order" produced exactly one `POST /orders` (201) and one DB row. The button's `disabled={loading}` state works. Removed from the critical list; the idempotency-key recommendation is retained as defense-in-depth at P2.
- **P1-5 Cross-store cart wipe: CORRECTED.** A proper "Switch store?" confirmation modal DOES exist ("Keep cart" / "Switch store") — the static claim of a *silent* wipe was wrong. **But a NEW BUG makes it arguably worse:** confirming the switch clears the cart then adds NOTHING due to a stale closure at `StoreProfile.jsx:26` (reproduced twice). Net effect: explicit user confirmation followed by total cart loss. Remains High (P1), reworded.
- **P2-7 Pharmacy double-click false failures: REFUTED live.** Double-clicks on Accept / Start Packing / Mark Dispatched each produced exactly one `PATCH …/orders/pharmacy/:id/status` (all 200), zero false errors. Moved to the refuted list (§12).
- **P0-4 Admin mobile nav dead zone: CONFIRMED AND WORSE.** Verified at 768px and 390px: sidebar `display:none`, no hamburger anywhere in DOM. Additionally, the **pharmacy portal also has zero nav at 390px** — sidebar hidden, no hamburger/drawer/bottom tabs (`screenshots/22–24`). Both portals' mobile breakpoints are unnavigable; the shared SidebarNav/drawer fix now explicitly covers both.

---

## 4. High Findings (P1)

| # | Finding | File References | Detail |
| :--- | :--- | :--- | :--- |
| P1-1 | **Token refresh thundering herd — no single-flight promise.** Multiple concurrent 401s each trigger their own refresh call. Under token rotation, later refreshes invalidate earlier ones → random mass logouts mid-checkout. | `api.js:70` | Concurrent requests race the refresh endpoint; losers get logged out |
| P1-2 | **`hydrate()` clears tokens when only the access token is expired**, without attempting refresh first. Result: silent logouts on page reload even when the refresh token is perfectly valid. | `authStore.js:106–124` | Reload during active session → user dumped to login |
| P1-3 | **No forgot/reset/change password flows anywhere in the app.** Users with lost credentials have zero recovery paths; authenticated users cannot rotate passwords. | App-wide (absence) | Account lockouts require manual support intervention |
| P1-4 | **Login ignores `state.from` deep-link redirect.** Guards stash the intended destination in navigation state, but Login never reads it — every login lands on a fixed default page. | `Login.jsx:38–47` vs `guards.jsx:8,18,38` | Deep links (order confirmations, notifications) break post-login |
| P1-5 | **Cross-store switch destroys the cart after explicit confirmation.** *(Revised live: the "Switch store?" confirmation modal DOES exist — original static claim of a silent wipe was wrong.)* However, confirming the switch calls `clearCart()` then fails to add the newly selected item due to a stale closure at `StoreProfile.jsx:26` — the user confirms losing their cart and receives nothing in return (reproduced 2×). | `StoreProfile.jsx:26` (stale closure), `cartStore.js:30–37` | Confirmed data destruction with consent obtained then betrayed; worse than silent loss for trust |
| P1-6 | **`useAddresses` swallows errors** via `.catch(() => {})`. Address load failures render as "you have no addresses" rather than an error state. | `useAddresses.js:12` | Users re-enter addresses believing none were saved |
| P1-7 | **ConsumerHome discards API errors entirely** → a backend outage renders as an empty marketplace, indistinguishable from "no products exist". | `ConsumerHome.jsx:30–31` | Outage looks like catalog extinction; kills conversion |
| P1-8 | **ToastContainer lacks `aria-live` / `role="status"`** → checkout errors are completely invisible to screen readers. Close button also missing `aria-label`. | `ToastContainer.jsx:33` | Blind users cannot perceive payment/order failures |
| P1-9 | **Dead-end error states without retry** despite hooks exposing `refetch`. Three surfaces strand the user on an unrecoverable error screen. | `ConsumerStores:121–123`, `MyOrders:75–79`, `PharmacyOrders:65` | Any transient network blip permanently blocks the surface until manual reload |
| P1-10 | **`--green-400` referenced but undefined** in `tokens.css`; three files silently fall back to hardcoded Tailwind `#22c55e`. | `tokens.css` (missing definition); 3 consumer files | Undefined-token drift; off-brand green shipped to production |

---

## 5. Medium Findings (P2)

### 5.1 Interaction & Accessibility

| # | Finding | References |
| :--- | :--- | :--- |
| P2-1 | Modals lack focus trap, focus restore, and Esc-to-close — **5 of 6 modals** affected | Modal components app-wide |
| P2-2 | Keyboard-unreachable clickable `<div>`s on ConsumerHome cards; ConsumerStores implements the correct pattern (contrast within same codebase) | `ConsumerHome` cards vs `ConsumerStores` |
| P2-3 | Search race condition — no AbortController; slow responses overwrite newer results | `useMedicines.js:9–20` |
| P2-4 | Toast close button missing accessible name (paired with P1-8) | `ToastContainer.jsx:33` |

### 5.2 Loading & Feedback Consistency

| # | Finding |
| :--- | :--- |
| P2-5 | Three competing loading paradigms: skeleton screens vs plain `"Loading orders..."` text vs nothing at all on ConsumerHome |
| P2-6 | Button component has no loading/disabled-during-submit prop — every consumer hand-rolls spinner state |
| P2-7 | ~~Pharmacy action buttons vulnerable to double-click false failures~~ **REFUTED live** (single PATCH per double-click, all 200, zero errors) — see §12 Corrections Log. Idempotency hardening remains optional defense-in-depth. |

### 5.3 Architecture

| # | Finding | Sizes |
| :--- | :--- | :--- |
| P2-8 | God components | `Checkout` 389 ln · `AdminApplicationReview` 504 ln · `PharmacyAnalytics` 442 ln · `PharmacyRegister` 438 ln · `ConsumerProfile` 429 ln |
| P2-9 | ~90% duplicated sidebar/layout code between Pharmacy and Admin layouts, with active drift: max-width `1280` vs `1200` vs unbounded; sidebar width `220` vs `240px` | Layout modules both portals |
| P2-10 | Dead topbar in PharmacyLayout consuming 56px of vertical space while rendering nothing useful | `PharmacyLayout` |
| P2-11 | `EmptyState` shared component exists but is imported nowhere — every page reimplements empties | Shared components dir |
| P2-12 | Ad-hoc inline styles in drawer/NotFound bypass the CSS Modules architecture | Drawer, NotFound |
| P2-13 | Duplicate notification pollers running every 30s independently | Notification hooks/consumers |

### 5.4 State Persistence

| # | Finding |
| :--- | :--- |
| P2-14 | Cart persisted in `sessionStorage` (dies on tab close) while auth persists in `localStorage` — inconsistent survival semantics; closing a tab loses the cart but keeps the session |
| P2-15 | Re-login loses checkout context entirely (no return-to-checkout restoration) |

### 5.5 Forms & Validation

| # | Finding |
| :--- | :--- |
| P2-16 | Document upload: no client-side 5MB size check; raw `fetch` bypasses the refresh interceptor |
| P2-17 | Card/UPI validation only fires on-submit via ephemeral toasts; no input masking, no inline field validation |

### 5.18 Typography, Color & Tokens

| # | Finding |
| :--- | :--- |
| P2-19 | 19 distinct font sizes including illegible 9px/10px text; page titles vary 22/26/28px for the same semantic role; zero type-scale tokens |
| P2-20 | 164 hardcoded hexes + 1,541 raw px values vs only 10 spacing tokens |
| P2-21 | `Badge.module.css`: 8 of 13 variants hardcode hex pairs instead of consuming tokens |
| P2-22 | `KpiCard` bypasses tokens via raw color props |
| P2-23 | No breadcrumbs anywhere despite deep hierarchies (stores → store → medicine; admin pharmacies → pharmacy detail) |

### 5.24 Routing Chrome

| # | Finding |
| :--- | :--- |
| P2-25 | `/pharmacy/register`, `/pharmacy/pending`, `/pharmacy/suspended` render with zero chrome — bare pages with no header/footer/branding |
| P2-26 | 404 renders outside portal layout — logged-in users lose all navigation on any bad URL |

---

## 6. What Works Well

The audit is not one-sided. These patterns are exemplary and should be treated as internal reference implementations:

| Area | Strength |
| :--- | :--- |
| **Auth architecture** | Route guards and role gating implemented correctly across all three roles, including **status-based pharmacy gating** (pending/suspended states handled distinctly) |
| **GPS-denied flow** | Distinct, actionable messages per error code — permission-denied vs timeout vs unavailable each get tailored copy. Best-in-class edge-case UX in the codebase |
| **Empty states** | Polished, branded empties on Cart, Orders, Search results, and zero-analytics dashboards |
| **Document upload resilience** | Uses `Promise.allSettled` — honestly reports partial failure instead of all-or-nothing |
| **Error boundaries** | Global ErrorBoundary with a functional "Try Again" recovery action |
| **API error mapping** | Response envelope maps 403/404/409 to meaningful user-facing messages |
| **Typography pairing** | Fraunces (display serif) + Plus Jakarta Sans (UI sans) is a distinctive, premium pairing |
| **Dark token hygiene** | Dark-mode tokens annotated with computed AA contrast ratios |
| **Focus visibility** | Global `focus-visible` outline implemented |
| **Destructive commerce actions** | Store-switch confirmation modal prevents accidental cart loss *when triggered through the modal path* (though see P1-5 for the silent path) |

---

## 7. Route/Page Inventory

Complete routing inventory as implemented:

### Public

| Route | Page |
| :--- | :--- |
| `/` | Landing / Home |
| `/login` | Login |
| `/signup` | Sign Up |
| `/about` | About |
| `/how-it-works` | How It Works |
| `/for-pharmacies` | For Pharmacies (B2B pitch) |

### Standalone (no portal chrome)

| Route | Page |
| :--- | :--- |
| `/pharmacy/register` | Pharmacy Registration |
| `/pharmacy/pending` | Application Pending |
| `/pharmacy/suspended` | Pharmacy Suspended |
| `*` | 404 Not Found (renders outside portal layout — see P2-26) |

### Consumer Portal

| Route | Page |
| :--- | :--- |
| `/home` | Consumer Home |
| `/stores` | Store Listing |
| `/stores/:storeId` | Store Detail |
| `/medicines` | Medicine Catalog |
| `/medicines/:medicineId` | Medicine Detail |
| `/cart` | Cart |
| `/checkout` | Checkout |
| `/orders` | Order History |
| `/orders/:orderId` | Order Detail |
| `/profile` | Profile |
| `/notifications` | Notifications |

### Pharmacy Portal

| Route | Page |
| :--- | :--- |
| `/pharmacy/dashboard` | Dashboard |
| `/pharmacy/inventory` | Inventory |
| `/pharmacy/inventory/expiry` | Expiry Tracking |
| `/pharmacy/orders` | Orders |
| `/pharmacy/analytics` | Analytics |
| `/pharmacy/pricing` | Pricing |
| `/pharmacy/profile` | Pharmacy Profile |
| `/pharmacy/notifications` | Notifications |
| `/pharmacy/complaints` | Complaints |

### Admin Portal

| Route | Page |
| :--- | :--- |
| `/admin/dashboard` | Dashboard |
| `/admin/pharmacies` | Pharmacy Applications List |
| `/admin/pharmacies/:id` | Pharmacy Application Review |
| `/admin/medicines` | Medicine Management |
| `/admin/orders` | Orders |
| `/admin/analytics` | Analytics |
| `/admin/complaints` | Complaints |
| `/admin/users` | Users |
| `/admin/settings` | Settings |
| `/admin/notifications` | Notifications |

---

## 8. Missing Screens

Screens absent from the app that block parity with category-standard expectations:

| # | Missing Screen | Severity Context |
| :--- | :--- | :--- |
| M-1 | Forgot / reset / change password (see P1-3) | Trust-critical |
| M-2 | Address book management UI (add/edit/delete/set-default beyond checkout-inline) | Commerce-critical |
| M-3 | Pharmacy order detail page | Ops gap |
| M-4 | Admin order detail page | Ops gap |
| M-5 | Dedicated search results page (search currently embedded) | Discovery |
| M-6 | Terms of Service / Privacy Policy / Contact | Legal-compliance |
| M-7 | Prescription upload flow (Rx-gated SKUs) | Regulatory |
| M-8 | Wishlist | Growth |
| M-9 | One-tap reorder | Growth |
| M-10 | Consumer help center / FAQ | Support deflection |
| M-11 | Admin user detail page | Admin depth |
| M-12 | Admin complaint detail page | Admin depth |

---

## 9. Quantified Drift Summary

### Token Adoption

| Metric | Value | Interpretation |
| :--- | :--- | :--- |
| `var()` token usages | **2,206** (~93% adoption) | Genuine token culture exists |
| Hardcoded hex values (CSS files) | **164** (~7%) | Enforcement gap, not absence of system |
| Hex literals in JSX inline styles | **230** | Bypass layer around CSS Modules entirely |
| Raw px values | **1,541** | Spacing/sizing done ad-hoc vs 10 spacing tokens |
| Distinct font sizes | **19** | Includes illegible 9px and 10px |
| Typography tokens | **0** | No type scale defined |
| Line-height values | **11** | Uncontrolled vertical rhythm |
| `prefers-reduced-motion` rules | **0** | Across 136 motion elements / 52 files |

### Worst Inline-Style Offenders

| File | Hex count in JSX |
| :--- | :--- |
| `ConsumerProfile` | 29 |
| `PharmacyAnalytics` | 22 |
| `ExpiryAlerts` | 22 |

### Contrast Audit (WCAG AA = 4.5:1 normal text)

| Foreground | Background | Ratio | Verdict |
| :--- | :--- | :--- | :--- |
| `--green-700` | White | 6.50 | ✅ Pass |
| `--ink-500` | Light / Dark | 6.39 / 5.60 | ✅ Pass |
| `--ink-400` | Light | 4.83 | ✅ Pass |
| `white@65%` | Dark surface | 13.11 | ✅ Pass |
| `--warning` `#D97706` | White | **3.19** | ❌ **FAIL** |
| `--success` `#059669` | White | **3.77** | ❌ **FAIL** |

---

## 10. Prioritized Recommendations

### Top 10 Fixes (ranked)

| Rank | Fix | Resolves |
| :--- | :--- | :--- |
| 1 | Validate `selectedAddr` exists at checkout step gate; disable Place Order otherwise | P0-1 |
| 2 | Server-side stock revalidation + client quantity clamping with remediation UI (remove/reduce item prompt) | P0-2 |
| 3 | In-flight submission guard + idempotency key + disable Back during submit | P0-3 |
| 4 | Port the Pharmacy drawer pattern into AdminLayout below 900px | P0-4 |
| 5 | Darken `--warning` and `--success` (or introduce `-text` variants) to pass 4.5:1 | P0-5 |
| 6 | Add global `prefers-reduced-motion: reduce` kill-switch for animations/transitions | P0-6 |
| 7 | Single-flight refresh promise in `api.js` request queue | P1-1 |
| 8 | Fix `hydrate()` to attempt refresh when only access token is expired | P1-2 |
| 9 | Build forgot/reset/change password flows end-to-end | P1-3 / M-1 |
| 10 | Honor `state.from` redirect in Login; add aria-live to ToastContainer | P1-4 / P1-8 |

### Feature Roadmap Tiers

#### Tier 1 — Trust & Compliance
- Prescription upload flow gating Rx-only SKUs (M-7)
- Password recovery end-to-end (forgot → email → reset; change in profile)
- Server-side stock revalidation + idempotency keys on order creation
- Terms / Privacy / Contact pages (M-6)

#### Tier 2 — Commerce Growth
- Wishlist (M-8)
- One-tap reorder from order history (M-9)
- Global search + dedicated results page (M-5)
- Address book management (M-2)
- Price-drop and back-in-stock notifications
- Substitute medicine suggestions for out-of-stock items

#### Tier 3 — Platform Polish
- Extract shared `Modal` (with trap/restore/Esc), `ErrorRetry`, and `PortalShell` components — collapse the ~90% layout duplication
- Typography scale tokens (type ramp) + stylelint enforcement rules for hex/px
- Admin accent identity color to visually distinguish portals
- Order-detail routes for pharmacy and admin (M-3, M-4)
- Notification polling dedupe + user preferences
- Consume the orphaned `EmptyState` component everywhere
- Cart persistence parity with auth (`localStorage`) + restore checkout context after re-login

---

## 11. Live Browser Walkthrough

**Executed:** August 25, 2026. Full raw findings in [`live-walkthrough-findings.md`](./live-walkthrough-findings.md).

### Setup

- **Servers:** frontend dev server `http://localhost:5173` (Vite), backend `http://localhost:3000`, Postgres DB inspected directly for credential verification.
- **Portals tested end-to-end:** Public pages, Consumer, Pharmacy, Admin — including signup, full order lifecycle (New → Accepted → Packing → Dispatched), checkout, search, analytics, and responsive breakpoints (1280 / 768 / 390px).
- **Evidence:** 27 screenshots captured in `screenshots/` (index in the walkthrough doc: `01-landing-full.png` … `27-cart-contrast-floatbug.png`).

### Key Confirmations

- Missing-address checkout bug **confirmed**: payment step reached with no address selected, zero validation feedback.
- Contrast failures **confirmed live**: cart "Clear all" red 3.30:1, 11px green hint 3.77:1, admin "0 rejected" red 3.76:1 — all below AA.
- 10px illegible category labels on consumer home medicine cards **confirmed** (measured exactly 10px computed).
- Loading-state inconsistency **confirmed** (skeletons vs plain text vs nothing).
- Full pharmacy order lifecycle works; admin and pharmacy dashboards/analytics render real data.

### Key Refutations

- Duplicate-order double-click bug: **refuted** (one POST per double-click; button disables correctly) — P0-3 withdrawn.
- Pharmacy double-click "Failed to update" false failures: **refuted** (single PATCH per action, all 200).
- Cross-store *silent* cart wipe: **corrected** — confirmation modal exists; the real bug is the stale-closure no-op add after confirming (`StoreProfile.jsx:26`).

### Discovered Live (new findings not visible statically)

| # | Severity | Finding | Evidence |
| :--- | :--- | :--- | :--- |
| L-1 | **P0** | **Seed data is fundamentally broken.** README test credentials don't exist in the DB: actual admin is `admin@medmarket.in` (not `milind@medmarket.in`); `priya.sharma@…` and `rahul.gupta@…` don't exist at all. Worse, ALL seeded consumers (`consumer0–9@gmail.com`) carry placeholder password hashes (`backend/prisma/seed.ts:122`) that match no password — **no consumer can ever log in** against the seeded DB. QA following the README cannot test the consumer flow. | Direct DB inspection; live login attempts |
| L-2 | **P0/P1** | **Login page enters a CPU-pegged render loop under auth rate-limit bursts.** After rapid failed logins (429s from the 20 req/10 min limiter, with CORS preflight OPTIONS double-counting quota), the page pegged a renderer process at ~88% CPU until the tab was killed. | `rateLimit.middleware.ts:12`; live observation |
| L-3 | **P1** | **Store profile pages have NO path to medicine detail pages.** Medicine cards inside `/stores/:storeId` cannot be opened; `/medicines/:id` exists but is unreachable from this surface. | Live click-through; DOM scan |
| L-4 | **P1** | **Raw float displayed to users:** price rendered as `₹18.870000000000005` on consumer surfaces — missing currency formatting/rounding. | `screenshots/27-cart-contrast-floatbug.png` |
| L-5 | **P1** | **4 duplicate search API calls fire per query** (`GET /api/v1/medicines?search=…` ×4) — no debounce dedupe and no AbortController; wasted load plus the existing race-condition risk (P2-3). | Devtools network log |

---

## 12. Corrections Log

Static claims refuted or revised after live browser testing (audit hygiene — kept for traceability):

| Original Claim | Disposition | Basis |
| :--- | :--- | :--- |
| P0-3: Double-click Place Order creates duplicate orders | **REFUTED → withdrawn from critical list.** Idempotency-key recommendation retained as defense-in-depth (P2). | Live dblclick produced exactly 1 POST / 1 DB row; button `disabled={loading}` works |
| P2-7: Pharmacy double-click causes false "Failed to update" errors | **REFUTED → moved to refuted list.** | 1 PATCH per dblclick across Accept/Pack/Dispatch, all 200 |
| P1-5: Cross-store add silently wipes cart without confirmation | **CORRECTED.** Confirmation modal exists (static audit wrong about silence). Reclassified wording but stays High: confirming the switch clears the cart then adds nothing due to stale closure at `StoreProfile.jsx:26`. | Modal observed live (`screenshots/10-switch-store-modal.png`); bug reproduced 2× |
| P0-4: Admin portal unnavigable below 900px | **CONFIRMED AND WORSE** — pharmacy portal also has zero nav at 390px (sidebar hidden, no hamburger). Scope of fix widened to both portals. | `screenshots/22–24` |

---
*End of report.*
