# Contract: Design System & Accessibility Remediation

## Title
Design System & Accessibility Remediation

## Priority
Medium-High (P1.5) — accessibility compliance (WCAG AA contrast) + long-tail design-debt cleanup across the app.

## Status
open

## Scope
Files to touch (frontend root: `/Users/milindbansal/Vs Code/Web Dev/Project/MedMarket/frontend`):
- `src/styles/tokens.css` — new `--fs-*` type scale, `--green-400`, motion preset tokens
- `src/styles/motion.js` or `src/hooks/useMotionPresets.js` (NEW) — shared motion presets honoring reduced-motion
- `src/styles/global.css` — replace literal body colors with vars; global `prefers-reduced-motion` fallback for shimmer skeletons
- `src/pages/consumer/ConsumerHome.module.css` (+ `.jsx`) — `.openBadge` and similar status-text usages → dark variants
- All status-colored text usages app-wide (grep-driven list: badges, labels, order statuses)
- `src/components/ui/ToastContainer.jsx` (+ module css) — live-region roles, close-button aria-label
- `src/components/ui/Button.jsx` + its module css — `loading` prop, tokenize `.danger` hexes, Badge variant pairs if Badge lives in ui/
- `src/components/ui/Badge.jsx` (or equivalent) — variant color pairs via tokens
- `src/components/ui/KpiCard.jsx` / page-transition wrapper — apply motion presets
- `src/pages/consumer/Checkout.jsx` submit button; `GoogleSignInButton` component — migrate to Button `loading`
- Skeleton/shimmer CSS files (grep for `shimmer`/`skeleton`)

Out of scope: introducing a CSS-in-JS or styling library, changing brand hues (only usage-context changes), backend.

## Problem Statement

### a) Failing text contrast
Mid-tone palette colors (e.g., `--warning`, `--success`) are used directly as TEXT colors on light backgrounds in places like ConsumerHome's `.openBadge`. These mid-tones measure below 4.5:1 for body-size text. The palettes already ship `-dark` siblings intended for text use but adoption is inconsistent.

### b) No reduced-motion support
Animations (page transitions, KpiCard stagger, button spring, shimmer skeletons) run unconditionally. Users with `prefers-reduced-motion: reduce` get full motion; there is no shared mechanism, so each surface would need ad-hoc handling.

### c) Toast container not announced to screen readers
`ToastContainer` lacks `role="status"`/`aria-live`, so dynamic toasts (including errors) are silent for assistive tech. Close buttons have no accessible name.

### d) Uncontrolled typography drift
19 distinct font sizes exist across modules with no scale; page titles vary at 22/26/28px depending on file. Micro-type exists below readable floor.

### e) Token hygiene gaps
- `--green-400` referenced/needed but not properly defined.
- Button `.danger` variant uses hardcoded hex values.
- Badge variant pairs hardcode fg/bg per variant.
- `global.css` body colors use literal hex instead of vars.

### f) Buttons lack loading state
Submit flows (Checkout place-order, Google sign-in) hand-roll disabled/spinner logic inconsistently (Checkout's is also contractually tied to frontend-contract-fix-critical-checkout item b).

## Required Changes
1. **Contrast (a):** Grep all usages of `var(--warning)`, `var(--success)`, `var(--danger)`, `var(--info)` applied to `color:` on TEXT elements. Route every such text usage through `--warning-dark`, `--success-dark`, `--danger-dark`, `--info-dark`. Mid-tones remain allowed ONLY for backgrounds, icon fills, and borders. Start with `ConsumerHome .openBadge`; build the full grep list and fix exhaustively (record count in log).
2. **Motion presets (b):**
   - Create `src/styles/motion.js` exporting presets (e.g., `pageTransition`, `stagger`, `springPress`) built on the project's existing animation lib if present (framer-motion? check imports) else CSS-class-based presets.
   - Each preset checks `useReducedMotion()` (from framer-motion if available; otherwise implement a 5-line `matchMedia('(prefers-reduced-motion: reduce)')` hook). When reduced: durations → ~0, transforms/displacement removed, opacity-only fades ≤0.15s permitted.
   - Apply to: page transition wrapper(s), KpiCard stagger, Button press/spring.
   - Add to global.css:
     ```css
     @media (prefers-reduced-motion: reduce) {
       .shimmer, [class*='skeleton'] { animation: none; background: var(--surface-muted); }
     }
     ```
     (adapt selector names to actual skeleton classes).
3. **Toast a11y (c):**
   - Container element: `role="status"` + `aria-live="polite"`.
   - For toast items where `type === 'error'`: render with `role="alert"` (assertive).
   - Close button: `aria-label="Dismiss notification"` (or "Dismiss error" for errors).
   - Ensure visually-hidden text isn't double-announced (avoid aria-label duplicating visible text verbatim).
4. **Type scale (d):**
   - In tokens.css define a scale, e.g.: `--fs-xs: 11px; --fs-sm: 13px; --fs-base: 14px; --fs-md: 16px; --fs-lg: 18px; --fs-xl: 20px; --fs-2xl: 24px; --fs-3xl: 30px;` (implementer may adjust step sizes; MUST document final scale here-in-log).
   - Map ALL 19 existing sizes onto nearest token (grep `font-size:` across src/, build mapping table in completion log). Floor any sub-11px value at `--fs-xs`.
   - Create one `.pageTitle` class (global or shared module) = `font-size: var(--fs-2xl)` and migrate every page-title usage (the 22/26/28px set) to it.
5. **Token hygiene (e):**
   - Define `--green-400` in tokens.css with the value consistent with existing green ramp (derive by inspecting neighboring greens; document choice).
   - Replace Button `.danger` hardcoded hexes with semantic vars (`--danger`, `--danger-dark` hover, etc.).
   - Refactor Badge variants to consume token PAIRS (e.g., define per-variant `--badge-*-fg/--bg` or map to existing `*-dark`/mid tokens).
   - global.css body/background literals → `var(--text-primary)`, `var(--bg-page)` etc. per existing token names.
6. **Button loading prop (f):**
   - Add `loading?: boolean` to Button. When true: render inline spinner (existing spinner asset/class if present), set `aria-busy="true"`, `disabled` behavior (visually disabled + click-guard), preserve width to prevent layout shift (`min-width` from label or fixed class).
   - Migrate Checkout's Place Order button: `loading={submitting}` (aligning with Contract 1's `submitting` derivation — coordinate to avoid merge conflict; Contract 1 owns the guard, this contract owns the prop).
   - Migrate GoogleSignInButton similarly during auth call.

## Acceptance Criteria
- [ ] Every status TEXT element (badges, labels, statuses) computes ≥4.5:1 contrast against its background — verified on consumer home AND checkout.
- [ ] Mid-tone vars appear only as fill/border/background in CSS (grep audit: no `color: var(--warning)` style direct-text usage remains).
- [ ] With OS "Reduce motion" enabled: page transitions, KpiCard stagger, and button springs are effectively static/instant; shimmer skeletons render as static blocks.
- [ ] With reduced-motion OFF, animations behave exactly as before (no visual regression).
- [ ] Screen-reader smoke test (VoiceOver): firing a success toast announces politely; an error toast announces assertively; close buttons announce their label.
- [ ] Grep confirms zero raw px font-sizes outside tokens.css (excluding third-party resets); the 19 legacy sizes each have a recorded mapping to a `--fs-*` token.
- [ ] All page titles render at one size (single `.pageTitle` tokenized class).
- [ ] `--green-400` defined; zero hardcoded hexes in Button `.danger`, Badge variants, or global.css body rules.
- [ ] `<Button loading>` shows spinner + `aria-busy` + non-interactive; width does not jump when toggling.
- [ ] Checkout submit and GoogleSignInButton both use the new prop (no bespoke spinners left).

## Test Plan
1. **Verification note (mandatory):** Run axe-core (browser extension or jest-axe if vitest+jsdom configured) on `/` (consumer home) and `/checkout` post-change. Export/report results into the completion log. If axe unavailable, manually verify contrast ratios with WebAIM checker for EVERY status-text/bg pair touched and paste computed ratios in the log.
2. Emulate `prefers-reduced-motion: reduce` in devtools rendering tab → walk home, KPI section, checkout; confirm static behavior; disable → confirm unchanged baseline.
3. VoiceOver (macOS) pass over toast triggers: trigger success + error toasts from cart actions.
4. Type-scale audit script: `rg "font-size:" src --glob '!tokens.css'` must return only `var(--fs-*)` usages.
5. Visual regression spot check: screenshots of consumer home + checkout before/after (contrast fixes will shift badge colors slightly — acceptable; layout shifts are NOT).
6. Interaction test: Checkout submit under throttled network using Button loading state; confirm no double-click possible and layout stable.

## Estimated Effort
10–14 hours (contrast sweep 2h, motion system + application 3h, toast a11y 1h, type scale + migration 3h, token hygiene 2h, Button.loading + migrations 1.5h, verification/QA 1.5–2h)
