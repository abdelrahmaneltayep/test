# PDV2-422 — Partner Feature Cross-Sell · 5 Patterns

A runnable, high-fidelity frontend prototype demonstrating **five patterns for introducing
partner features to merchants**, built as a decision aid for
[PDV2-422](https://salla-dev.atlassian.net/browse/PDV2-422) — cross-selling the **Tayaar**
fleet-management app inside Salla's Quick Delivery activation flow.

Frontend only. No backend, no API, no auth, no billing. Every activation is a 900 ms mock.

## Run

```bash
npm install
npm run dev          # http://localhost:5173
```

```bash
npm run build        # production build
npm run preview      # serve the build on :4173
npm run test:smoke   # 44 smoke + a11y assertions (needs preview running)
```

## The five patterns

| # | Pattern | Route | Benchmark rank |
|---|---|---|---|
| **1** | **Contextual In-Workflow Card** — the cross-sell appears inside Quick Delivery activation, under the provider dropdown, at the moment the merchant picks own couriers. | `/#/pattern-1` | **Primary** |
| 2 | **Curated Marketplace Slot** — a "Recommended by Salla" shelf in the App Store, plus a partner detail page. | `/#/pattern-2` | Deferred |
| 3 | **Setup Wizard Checkpoint** — a 5-step onboarding wizard that offers Tayaar at step 4 (Fulfillment Method). | `/#/pattern-3` | Deferred |
| 4 | **Persistent Dashboard Banner** — compact strip and expanded hero card on the dashboard home, with dismiss and 24 h snooze. | `/#/pattern-4` | Deferred |
| **5** | **Empty-State Prompt** — the Orders "awaiting courier" tab offers Tayaar when orders are actually stalling. | `/#/pattern-5` | **Primary** |

*Screenshot placeholders: `docs/pattern-1.png` … `docs/pattern-5.png` — capture from a running dev server.*

### Why 1 and 5 are the primaries

Both fire on **evidence of the merchant's own intent** — one on an explicit provider choice,
the other on orders that are demonstrably stuck. Patterns 2–4 interrupt without that signal,
so they carry the cost of a cross-sell without its context.

## Shared components

Every pattern composes these — none re-implements activation:

`TayaarActivationDrawer` (ST2, the single activation surface) · `TayaarCard` (ST1, six states) ·
`TayaarSummaryStrip` (ST3) · `TrialBanner` (ST4) · `SallaShell` / `TopBar` / `SubNav` ·
`AlertBox` · `Button` · `Chip` · `Toggle` · `RadioCard` · `Dropdown` · `Modal` · `ToastHost` · `Confetti`

## Known deviations from production

Read this before treating any pixel as spec.

### 1. Design tokens are the **real** Salla values, not the brief's

The build brief listed approximate tokens. These are the values from the
[`salla-ds`](https://github.com/abdelrahmaneltayep/salla-ds) component kit, which mirrors the
live merchant dashboard:

| Token | Brief said | **Used here** | What the brief's value actually is |
|---|---|---|---|
| `--salla-primary` | `#004D40` | **`#004A57`** | Material teal-900 |
| `--salla-danger-500` | `#E53E3E` | **`#F55157`** | Chakra red-500 |
| `--salla-success-500` | `#00AD6B` | `#00AD6B` | ✅ matches |
| radii | 4 / 8 / 12 | 4 / 8 / 12 | kept as specified |

Also added, because production uses it and the brief omitted it: `--salla-secondary #A3FFE5`,
the mint CTA colour behind **إطلاق الخدمة**.

**To revert:** edit `src/styles/tokens.css` only. Nothing else hard-codes a hex.

### 2. Numerals are **Western**, not Arabic-Indic

The brief asked for `٠-٩` throughout. The live Salla dashboard uses **Western digits in Arabic
UI** — the production Quick Delivery screen reads `25 كم`, `9:00 ص`, `23 مدينة`, `30-60 دقيقة`.
Production accuracy wins by default for a design benchmark.

**To switch:** set `NUMERALS = 'arabic-indic'` in `src/lib/num.ts`. One line; every string routes
through `n()`.

### 3. Everything else

- **Mock data** — branches, orders, KPIs, partner apps, ratings and install counts are invented
  (`src/data/mock.ts`). Courier count is static at 3.
- **Mock activation** — 900 ms `setTimeout`, 10 % failure by default. Adjust with the
  **نسبة الفشل** slider in the left rail; set it to 100 % to demo every error state on cue.
- **No Tayaar API, auth, or billing.** Deliberately out of scope.
- **Marketplace screenshots** are labelled placeholder tiles — no copyrighted assets.
  Logos are text monograms (`ط` Tayaar, `س` Salla).
- **Unvalidated statistics** — the 90 % compliance figure is shown with a
  **«قيد التحقق»** suffix, matching the parent PRD. It is pending Data + Partnerships validation
  and must not be quoted as fact.
- **Font** — PingARLT is Salla's licensed brand face and is not bundled. Falls back to
  IBM Plex Sans Arabic via Google Fonts.
- **Benchmark PRD not available** at build time. Patterns were implemented from the brief's own
  descriptions; the ranking shown in the left rail follows the brief's stated
  primary (1, 5) / deferred (2, 3, 4) split.
- **Routing is hash-based** (`/#/pattern-1`) so the build runs from `file://` or any static host
  with no server rewrites.

## Verification

`npm run test:smoke` covers the brief's 10 success criteria: all 5 routes render, the Pattern 1
activation path completes without reload, the marketplace detail sub-route reuses the same
drawer, the wizard gates step 4, the banner snooze survives reload, the empty state transitions
to live, a 100 % failure rate surfaces every error state, RTL/numerals are correct, and
**axe-core reports zero WCAG 2.1 A/AA violations** across all five routes.

## Stack

Vite 5 · React 18 · TypeScript 5 (strict) · Tailwind 3 · React Router 6 (hash) · Zustand 4 ·
Framer Motion 11 · lucide-react.

Initial JS bundle **≈98 KB gzipped** (budget: 250 KB). Pattern routes are lazy-loaded.

---

**This is a design prototype, not production code.** See "عن هذا النموذج الأولي" in the left rail.
