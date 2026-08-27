# Contract: Auth Resilience & Session Continuity

## Title
Auth Resilience & Session Continuity

## Priority
High (P1) — session loss on every access-token expiry destroys UX; refresh storms hammer the auth server.

## Status
open

## Scope
Files to touch (frontend root: `/Users/milindbansal/Vs Code/Web Dev/Project/MedMarket/frontend`):
- `src/utils/api.js` — single-flight refresh memoization (~line 70 `refreshAccessToken`)
- `src/store/authStore.js` — hydrate refresh attempt (~lines 106–124)
- `src/pages/public/Login.jsx` (verify actual path: may be `src/pages/auth/Login.jsx` — implementer confirms) — deep-link restore (~lines 38–47 `doNavigate`)
- `src/router/guards.jsx` — pass-through of `location.state.from`, logout redirect with current path
- `src/store/toastStore.js` consumers / a shared `SessionExpiredBanner` component in `src/components/ui/` — expiry UX
- Router setup file where `<Login />` is mounted (to wire `state={{ from }}`)

Out of scope: backend token endpoint changes, token storage mechanism migration, role model changes.

## Problem Statement

### a) Refresh stampede
At `api.js:70`, every 401 response triggers its own call to `refreshAccessToken`. When a page fires N parallel API calls and the access token has just expired, all N fail → N concurrent refresh calls. If the refresh endpoint rotates tokens server-side, calls 2..N use an already-consumed refresh token and can invalidate the whole session.

### b) Hydrate discards valid sessions
`authStore.js:106-124` (`hydrate`) checks the access token's expiry and, when expired, clears ALL tokens including the still-valid refresh token. A user reloading the tab within the refresh-token lifetime is logged out unnecessarily instead of being transparently re-authenticated.

### c) Deep links lost after login
`Login.jsx:38-47` (`doNavigate`) always routes to the role-based home after successful login, ignoring `location.state?.from`. A user who was deep-linked to e.g. `/orders/42` while logged out lands on the home page after logging in, losing their intended destination.

### d) Silent session expiry mid-app
When `auth:logout` fires from the interceptor mid-session, the user is redirected to login with no explanation. No toast/banner communicates why, and no return path preserves where they were.

## Required Changes
1. **Single-flight refresh (`api.js`):**
   - Introduce module-scoped state: `let refreshPromise = null`.
   - In `refreshAccessToken`: if `refreshPromise` is non-null, return it immediately.
   - Otherwise create the promise (existing fetch/refresh logic), assign to `refreshPromise`, and attach a `.finally(() => { refreshPromise = null })` so the lock clears on both success and failure.
   - Ensure queued 401 replays: each waiting caller must retry its ORIGINAL request with the new token after awaiting the shared promise (this behavior likely exists per-caller — verify it composes with the shared promise rather than each caller invoking refresh directly).
2. **Hydrate attempts refresh (`authStore.js`):**
   - In `hydrate`, when the parsed access token exists but is expired AND a refresh token is present: invoke the api-layer refresh (import or expose it appropriately; avoid circular imports — if needed, move the pure refresh function into a small `src/utils/tokenRefresh.js` consumed by both).
   - On refresh success: persist the new tokens exactly as a normal refresh would and restore the user session.
   - On refresh failure: fall back to existing clear-all behavior.
   - Keep hydrate synchronous-safe: since refresh is async, either make hydrate async and gate app render on hydration completion (check how App/main consumes hydrate), or set a `hydrating` flag that guards show a splash/loading state until resolved. Match the store's existing pattern.
3. **Deep-link restore (`doNavigate`):**
   - Read `location.state?.from` (from react-router's `useLocation`). If present and it is an internal path (starts with `/`, not `/login`), navigate there first.
   - Fall back to existing role-home routing only when `from` is absent.
4. **Preserve path on forced logout:**
   - Wherever the auth:logout handler redirects to login (interceptor in api.js or guards.jsx): capture the CURRENT full path including search params (`location.pathname + location.search`) and navigate with `state: { from }`.
   - Show user-facing feedback: fire a toast via toastStore ("Session expired — please log in again") OR render a persistent banner above the login form when `location.state?.sessionExpired` is true. Prefer banner-on-login (survives navigation) plus optional toast; pick one, implement fully.
5. **Guard interplay check:** Confirm protected-route guard does not clobber `state.from`. If guards already set `from` for unauthenticated visits, reuse that same convention for interceptor-driven logouts so Login reads one canonical field.

## Acceptance Criteria
- [ ] Simulate expired token + fire ≥5 concurrent API calls (e.g., consumer home dashboard loads): Network tab shows EXACTLY ONE request to the refresh endpoint.
- [ ] All 5 original requests are retried successfully with the new token; zero user-visible errors.
- [ ] With an expired access token and VALID refresh token in storage, a full page reload keeps the user logged in (hydrate refreshes; tokens rotated; no flash of logged-out state beyond allowed loading state).
- [ ] With expired access AND invalid/expired refresh token, reload logs the user out (existing fallback intact).
- [ ] Deep-link test: logged-out visit to `/orders/42` → redirected to login → login succeeds → land on `/orders/42`, not role home.
- [ ] Force token expiry mid-app (short TTL or manual localStorage edit): next API call triggers logout → login screen shows "Session expired — please log in again" (toast and/or banner).
- [ ] After that forced-expiry login, user returns to the exact route+query they were on.

## Test Plan
1. Devtools: set access-token exp to past, keep refresh valid → reload → assert session restored and refresh endpoint hit once.
2. Scripted burst: in console, `Promise.all([...Array(5)].map(() => api.get('/<any-endpoint>')))` with expired access → count refresh calls === 1.
3. Manual deep-link walk-through for each role's protected routes.
4. Negative path: corrupt refresh token → reload → clean logout, no infinite loop (watch for refresh-retry cycles in network tab).
5. Regression: standard login/logout, role-guard redirects, and 401-during-idle all behave as before except improved.

## Estimated Effort
5–7 hours (single-flight 1.5h, hydrate 2h incl. circular-import untangling, deep-link + expiry UX 1.5–2h, verification 1.5h)
