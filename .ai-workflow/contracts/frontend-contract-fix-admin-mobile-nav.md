# Contract: Admin + Pharmacy Portal Mobile Navigation

## Title
Admin + Pharmacy Portal Mobile Navigation (shared SidebarNav/drawer)

## Priority
Medium (P2) — **CONFIRMED LIVE (Aug 25, 2026): BOTH portals are unnavigable on mobile.** Admin sidebar is `display:none` at 768px/390px with no hamburger anywhere in the DOM; pharmacy portal likewise shows ZERO visible nav links at 390px (sidebar hidden, no hamburger/bottom tabs — a pharmacy owner on a phone cannot reach Inventory, Orders, or Analytics at all). Consistency debt between portals. Evidence: `screenshots/22–24` in the walkthrough findings.

## Status
open

## Scope
Files to touch (frontend root: `/Users/milindbansal/Vs Code/Web Dev/Project/MedMarket/frontend`):
- `src/components/navigation/SidebarNav.jsx` (NEW) — shared sidebar nav component fed by a nav-items config
- `src/config/nav-items.js` (NEW, or co-located per existing config conventions) — nav definitions for admin + pharmacy portals
- `src/layouts/AdminLayout.jsx` — consume SidebarNav; add mobile drawer behavior
- `src/layouts/AdminLayout.module.css` — drawer styles, breakpoint rules (~lines 163–167 currently the mobile gap)
- `src/layouts/PharmacyLayout.jsx` — swap inline nav markup for SidebarNav; remove dead topbar markup at lines 88–133 if untouched by drawer work; move drawer inline styles to CSS module
- `src/layouts/PharmacyLayout.module.css` — receive styles moved out of JSX inline
- `src/styles/tokens.css` — add shared `--layout-max-width` token (1280px) replacing the 1280 vs 1200px drift in both layouts

Out of scope: visual redesign of either portal's sidebar content, route changes, permission model.

## Problem Statement

### a) Admin portal has no mobile navigation — CONFIRMED live, worse than static analysis suggested
`AdminLayout.jsx` renders a persistent desktop sidebar. At `AdminLayout.module.css:163-167` there is no usable mobile pattern — below ~900px the sidebar either disappears (no access to admin nav) or breaks layout. Live verification: at 768px and 390px the only interactive elements are content buttons + Logout; zero menu triggers exist anywhere in the DOM (aria-label scan found none). At 390px `/admin/analytics` also overflows horizontally (569px content vs 390px viewport).

### b) Pharmacy portal ALSO has no mobile navigation — CONFIRMED live (scope expansion)
At 390px the pharmacy portal's sidebar/topbar nav is fully hidden with no hamburger, drawer, or bottom tabs. The ONLY visible link on the entire dashboard page is "View all →" inside content. **The prior static assumption that PharmacyLayout "already implements a working mobile overlay-drawer pattern" is WRONG for sub-768px** — whatever drawer pattern exists does not cover phone-class viewports. Both portals must ship working mobile navigation.

### c) ~90% duplication between Admin and Pharmacy sidebars
Both layouts hand-roll nearly identical sidebar markup (brand block, nav list with active-link styling, user/footer section). Any nav change must be made twice and has already drifted (max-width 1280px in one portal, 1200px in the other). The shared SidebarNav/drawer solution now explicitly covers BOTH portals' mobile breakpoints.

### d) Dead topbar markup + inline styles in PharmacyLayout
`PharmacyLayout.jsx:88-133` contains topbar-area markup that is not rendered/reachable after prior refactors (verify it is truly dead — not referenced by drawer logic) before removal. The drawer implementation uses JSX inline style objects that belong in the CSS module for consistency and reduced re-render surface.

## Required Changes
1. **Extract nav config:** Create `nav-items.js` exporting per-portal arrays: `{ label, to, icon, end? }[]`. Populate from the exact current link sets in both layouts — do NOT add/remove/reorder links during extraction.
2. **Create `SidebarNav`:** Props: `{ items, onNavigate? }`. Renders brand slot (prop or children), `<NavLink>` list preserving current active-state classes (accept a `classNames`/module prop so each portal keeps its own CSS module classes, OR define shared module — implementer picks the lower-churn option and documents choice). `onNavigate` fires on link click so layouts can close the mobile drawer.
3. **Wire into both layouts:** Replace duplicated nav lists with `<SidebarNav>`. Desktop rendering unchanged (persistent column ≥900px).
4. **Admin mobile drawer:**
   - Add hamburger button visible only <900px (aria-label="Open navigation menu", aria-expanded bound to state).
   - Implement the shared overlay-drawer pattern: fixed-position drawer sliding from left, backdrop element, body scroll-lock while open, close on backdrop click AND on any nav link click (via `onNavigate`), close on Escape key.
   - All new styles in `AdminLayout.module.css`; no inline styles.
5. **Pharmacy mobile drawer — REQUIRED (scope expanded after live verification):**
   - The pharmacy portal must receive the SAME working mobile nav at ≤768px. Verify whether an existing drawer pattern actually functions below 768px; live testing shows it does NOT (zero visible nav at 390px). Port the identical SidebarNav + hamburger + overlay-drawer solution into PharmacyLayout.
   - Hamburger visible only <900px, same aria attributes; all styles in `PharmacyLayout.module.css`; no inline styles.
6. **Pharmacy cleanup:**
   - First VERIFY lines 88–133 are dead: search for conditional renders/state that might mount them. Remove only if unreferenced; otherwise note in log and leave intact.
   - Move drawer-related inline `style={{...}}` objects from PharmacyLayout.jsx into PharmacyLayout.module.css as classes; apply identical class names conceptually to Admin's drawer for symmetry.
7. **Shared max-width token:** In tokens.css add `--layout-max-width: 1280px`. Update both layout modules' container widths to `var(--layout-max-width)` (pharmacy moves up from 1200 → 1280; flag this visual change in the completion log).

## Acceptance Criteria
- [ ] At 768px viewport, **admin portal** shows hamburger; clicking opens an overlay drawer containing ALL admin nav links.
- [ ] At 390px viewport (iPhone-class), admin drawer is fully usable: links tappable, no horizontal overflow, backdrop dims page.
- [ ] At 768px viewport, **pharmacy portal** shows hamburger; clicking opens an overlay drawer containing ALL pharmacy nav links.
- [ ] At 390px viewport, pharmacy portal has visible navigation to ALL sections (Inventory, Orders, Analytics reachable) — currently zero nav links are reachable at this width (confirmed live).
- [ ] Backdrop click closes the drawer; Escape closes it; clicking any nav link navigates AND closes it (BOTH portals).
- [ ] Body scroll is locked while drawer is open, restored on close (BOTH portals).
- [ ] Desktop regression: at ≥900px both portals render identical-to-before persistent sidebars (pixel-level spot check against pre-change screenshots); no hamburger visible.
- [ ] Both layouts' nav lists are driven by `SidebarNav` + `nav-items.js` — grep confirms no duplicated raw `<NavLink>` nav-list markup remains in the two layout files.
- [ ] Both portal containers resolve to the same computed max-width (1280px).
- [ ] PharmacyLayout.jsx contains no drawer-related inline `style` objects; lines 88–133 dead markup removed (or documented as still-alive with justification in log).
- [ ] Keyboard: hamburger focusable and operable via Enter/Space; drawer focus handling does not trap focus permanently.

## Test Plan
1. Browser devtools responsive mode at 390 / 768 / 900 / 1280 widths for BOTH portals; screenshot before/after desktop states for comparison. Baseline evidence of the broken states: `screenshots/22-admin-768-no-sidebar.png`, `23-admin-390-no-sidebar.png`, `24-pharmacy-390.png`.
2. Interaction matrix per portal: open→backdrop-close, open→link-close, open→Escape-close, open→resize-to-desktop (drawer should unmount/hide).
3. axe-core quick pass on admin AND pharmacy pages at 390px: no new contrast/name-role-value violations introduced by hamburger/backdrop.
4. Grep verification for dedupe criterion.
5. Route smoke test: every admin + pharmacy link in the config navigates to its intended route.

## Estimated Effort
8–10 hours (SidebarNav + config extraction 2–3h, Admin drawer 2h, Pharmacy mobile drawer implementation 2h, Pharmacy cleanup 1–1.5h, cross-viewport QA both portals 2h)
