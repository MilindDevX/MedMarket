# Contract: Checkout Flow Integrity Fixes

## Title
Checkout Flow Integrity Fixes

## Priority
Critical (P0) — blocks revenue path; data-integrity and money-loss risk.

## Status
open

## Scope
Files to touch (frontend root: `/Users/milindbansal/Vs Code/Web Dev/Project/MedMarket/frontend`):
- `src/pages/consumer/Checkout.jsx` — step gating, submit guard, failure handling, silent-failure elimination
- `src/pages/consumer/Checkout.module.css` — inline field error styles, flagged-line styles, disabled button states
- `src/store/cartStore.js` — add action to mark/remove specific unavailable lines (only if not already present)
- `src/utils/id.js` or new `src/utils/uuid.js` — client idempotency key generator (reuse existing crypto.randomUUID if available)
- `src/components/ui/Button.jsx` — only if a `disabledWhileSubmitting` prop is needed (coordinate with Contract 4f to avoid conflict)
- `src/pages/consumer/StoreProfile.jsx` — stale-closure fix for the confirm-switch flow (see Required Change 7)

Out of scope: backend changes, orderStore shape changes, payment integration.

## Problem Statement

### a) Missing address validation on step transition
At `Checkout.jsx:236`, the "Continue to Payment" handler advances the wizard from step 1 (address) to step 2 (payment) without checking that `selectedAddr != null` when `fulfillment === 'delivery'`. A user with no saved/selected address can reach payment and attempt placement of an order with no delivery destination. Pickup mode legitimately has no address and must not be gated.

### b) Double-submission of orders — VERIFIED-NOT-REPRODUCIBLE live
*(Revised Aug 25, 2026 after live walkthrough: rapid double-click + extra click on "Place Order" produced exactly ONE `POST /orders` and one DB row. The existing `disabled={loading}` state at `Checkout.jsx:306` works correctly in practice.)* The original concern is retained only as defense-in-depth at LOWER PRIORITY within this contract: keep the `if (loading) return` guard (cheap, harmless) and the idempotency key (forward-compatibility for when the backend honors it), but do not spend edge-case engineering effort on Back-navigation re-submit scenarios beyond what's already trivially covered.

### c) Stale stock / out-of-stock failure UX
When Place Order fails because items went out of stock between cart-add and checkout, the error is surfaced generically (toast) and the cart still contains the dead lines. The user is stuck in a loop: fix nothing → retry → same failure. Offending lines are never identified or offered for removal.

### d) Silent UPI/payment validation failure — CONFIRMED live (NEW)
With UPI selected but an empty UPI ID, clicking "Place Order" does nothing: no POST fires, no toast, no inline error, no visual cue whatsoever (`Checkout.jsx` `handlePlaceOrder` early-return branches). 100% silent failure — the user has zero feedback telling them what's missing or that their click registered at all.

### e) Confirm-switch stale closure destroys cart without adding — CONFIRMED live
In `StoreProfile.jsx:26`, confirming the "Switch store?" modal calls `clearCart()` then `handleAdd()`, but the stale-closure guard re-fires `setSwitchWarning` (already nulled) instead of adding the item. Net result: cart wiped, nothing added — reproduced twice live. The confirmation flow must actually deliver the clicked item into the now-empty cart.

## Required Changes
1. **Step-1 gate (`Checkout.jsx`, handler at ~line 236):** Before calling the step-advance setter, evaluate:
   - If `fulfillment === 'delivery'` and `selectedAddr == null`: set local state `addrError` to a human message ("Please select a delivery address to continue") rendered inline directly beneath the address selector block (new `.fieldError` class in `Checkout.module.css`), and return early. Do NOT use a toast.
   - If `fulfillment === 'pickup'`: skip the gate entirely.
   - Clear `addrError` whenever `selectedAddr` changes (subscribe in the handler or via effect).
2. **Reentrancy guard (`handlePlaceOrder`, line 87) — defense-in-depth, LOW PRIORITY (verified not reproducible live):**
   - Add a module/component-level ref: `const orderPlacedRef = useRef(false)` and reuse the hook's `loading`.
   - First line of `handlePlaceOrder`: `if (loading || orderPlacedRef.current) return`.
   - Set `orderPlacedRef.current = true` immediately after the guard passes (before any async work). Only reset it to `false` on definitive failure paths that allow retry (validation errors); leave it `true` on success since navigation away occurs.
3. **Idempotency key — defense-in-depth, LOW PRIORITY:** Generate one UUID per submit attempt (prefer `crypto.randomUUID()` with fallback helper), include as `idempotencyKey` in the POST body alongside the existing payload. Backend may ignore it initially — send it regardless so the contract is forward-compatible. Document this in a short comment above the fetch call site.
4. **Silent-failure elimination in `handlePlaceOrder` — HIGH PRIORITY (NEW):** Audit EVERY early-return / validation branch in `handlePlaceOrder`. Each one MUST surface user feedback before returning:
   - Field-level issues (empty UPI ID, invalid card fields): render an inline field error beneath the offending input (reuse `.fieldError` pattern from Required Change 1) AND focus the field.
   - Cross-cutting issues: show a toast as a fallback.
   - No branch may return without at least one visible feedback surface. Verify each early-return path manually against this rule.
5. **Disable navigation during flight:** While the place-order request is in flight:
   - Disable the "Back" button (~line 163) via `disabled={submitting}`.
   - Disable the stepper/header nav affordances if they permit leaving checkout mid-flight.
   - Derive `const submitting = loading || orderPlacedRef.current` and use it for all disabled states so UI and logic can't drift.
6. **OOS failure handling:** In the catch/error branch of place-order:
   - Detect stock-related failures by matching known message patterns (case-insensitive contains: `stock`, `out of stock`, `unavailable`) against the API error payload/message.
   - When detected: extract offending item identifiers from the error payload if provided (item id / medicine id list); mark those cart lines visually (new `.lineFlagged` style: warning-tinted border/background + "Out of stock" label) using a new cartStore action e.g. `flagUnavailable(ids)`.
   - Render an inline banner within the review step: "Some items are no longer available." with a single action button "Remove unavailable items" that calls the cartStore removal for all flagged ids, then clears flags.
   - Reset `orderPlacedRef.current = false` on any failure so retry is possible after remediation.
7. **StoreProfile.jsx:26 stale-closure fix (NEW):** In the confirm-switch handler, ensure that after `clearCart()`, the newly clicked item is ACTUALLY added to the now-empty cart. Root cause: the stale closure re-triggers the switch-warning guard instead of performing the add. Fix by passing the pending item explicitly through the confirm path (e.g., store the pending add payload and call `addToCart(pendingItem)` directly, bypassing the cross-store guard once the switch is confirmed). The switch-store flow must end with the clicked item IN the cart.
8. **Backend dependency note:** If no lightweight stock-check endpoint exists, do NOT invent one. Instead, add a code comment near cart mount listing required endpoint contract (`GET /cart/validate-stock` returning `{ itemId, available }[]`) and record it in this file's log as a backend dependency. Only implement mount-time revalidation if such an endpoint already exists in `src/utils/api.js`.

## Acceptance Criteria
- [ ] With `fulfillment = delivery` and no selected address, clicking "Continue to Payment" does NOT advance the step and shows an inline field-level error under the address selector (no toast).
- [ ] Selecting an address clears the inline error immediately.
- [ ] With `fulfillment = pickup` and no address selected, "Continue to Payment" advances normally.
- [ ] **ZERO silent-failure paths:** every early-return/validation branch in `handlePlaceOrder` surfaces visible feedback (inline field error or toast). Specifically: empty UPI ID + Place Order → inline error under the UPI field and the field receives focus. Verified by walking each branch.
- [ ] Rapid multi-click on "Place Order" produces exactly ONE network POST (verified live as already-working; guard kept as defense-in-depth — regression check only).
- [ ] A unique `idempotencyKey` UUID is present in the POST body of every submit attempt (defense-in-depth; backend may ignore).
- [ ] During an in-flight submit (throttle network to simulate), the Back control is visibly disabled and clicking it does nothing.
- [ ] On an OOS failure response, affected cart lines render with the flagged visual state and an "Out of stock" label.
- [ ] Clicking "Remove unavailable items" removes exactly the flagged lines from cartStore and persists across a page reload (per existing cart persistence behavior).
- [ ] After OOS remediation, a subsequent Place Order click is accepted (guard was reset).
- [ ] Confirming "Switch store?" on a store-profile add clears the old cart AND ends with the newly clicked item IN the cart (no-op add eliminated).

## Test Plan
1. Manual/devtools: run through both acceptance flows (delivery-no-address gate; pickup bypass).
2. Silent-failure audit: for each early-return branch in `handlePlaceOrder` (empty UPI, invalid card, missing fields), trigger it in the UI and confirm visible feedback + correct focus behavior.
3. Devtools Network tab: rapid multi-click test → count POSTs to order endpoint === 1 (regression check; live-verified working).
4. Switch-store flow: with items in cart from store A, click an item on store B's profile → confirm switch → assert cart contains ONLY the new item (not empty).
5. Mock failure: intercept the order POST (MSW/devtools override) returning `{ error: "Item X is out of stock" }` → assert flag rendering + remove action works; then unmock and confirm successful retry.
6. Unit (if vitest present): test cartStore `flagUnavailable` / removal actions in isolation.
7. Regression: full happy-path order placement in delivery AND pickup modes still completes and navigates to confirmation.

## Estimated Effort
8–10 hours (implementation 5–6h incl. silent-failure audit + stale-closure fix, edge-case verification + regression pass 3–4h)
