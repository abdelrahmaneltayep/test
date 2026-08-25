# PDV2-422 · Pattern 1 — 20 Layouts × 20 Flows

Decision aid for [PDV2-422](https://salla-dev.atlassian.net/browse/PDV2-422), built to the
**PRD v1.4 addendum**. Twenty layout variants for the Tayaar contextual cross-sell, each
playable against twenty merchant flows, so the MVP combination can be picked in one session.

Frontend only. No backend, no API, no auth, no billing.

```bash
npm install && npm run dev      # http://localhost:5173
npm run build && npm run preview
npm run test:smoke              # needs preview running on :4174
```

## How to drive it

- **Left rail** — 20 layouts grouped by family (A–D). The badge shows the verdict:
  ⭐ MVP · ● ship · ◐ A/B · ○ nice-to-have · · deferred.
- **▤ مصفوفة المقارنة** — the cover: the §5 comparison matrix, MVP recommendation, and all 20 flows.
- **محاكي التدفق** — the dropdown at the top of every layout. Pick any of F1–F20 and the
  layout re-renders in that flow's state. Every layout can play every flow.
- **نسبة الفشل** — failure-rate slider in the rail. Set 100 % to demo F16/F17 on cue.

## The one-click constraint (PRD §2)

Every layout satisfies the same contract, and none re-implements it:

- One primary action → activation fires → 900 ms → success. **No drawer, no confirm step.**
- Confirmation is retroactive: success toast + summary strip replacing the surface in place.
- Errors render **inline where the button was** (`role="alert"`), never as a modal.
- 5-second rollback window after activation (F19).

All of it lives in `src/components/Kit.tsx`; a layout is a placement plus a shape.

## Architecture

| Path | What |
|---|---|
| `src/layouts/family{A,B,C,D}.tsx` | The 20 layouts. Each is a small component + a `LayoutDef` (slot, footprint, verdict). |
| `src/components/Shell.tsx` | The real activation page with a **named slot** at every anchor point. A layout declares its slot; the shell places it. |
| `src/components/Kit.tsx` | Shared activation: `useCrossSell`, `SummaryStrip`, `InlineError`, `BranchChips`, `BranchTable`. |
| `src/lib/flows.ts` | The 20 flows as state deltas. |
| `src/store/store.ts` | One store: activation, errors, rollback, failure rate. |

Adding a 21st layout is one component plus one `LayoutDef` entry — the shell, flows, and
activation contract come for free.

## Known deviations from the PRD

### 1. Four tokens corrected for contrast

The §7 token table has four values that fail WCAG AA at body-text sizes. Corrected in
`src/styles/tokens.css`, each annotated inline. Everything else is verbatim.

| Token | PRD value | Measured | Used here | Now |
|---|---|---|---|---|
| `--salla-text-tertiary` | `#9CA3AF` | **2.54** on white | `#626B79` | 5.39 |
| `--salla-text-secondary` | `#6B7280` | **3.85** on mint · 4.50 on soft | `#5A6472` | 4.78 · 5.58 |
| `--salla-warning-700` | `#A87B00` | **3.55** on warning-50 | `#8A6300` | 5.05 |

`--salla-primary-300` was added for the focus ring — the table has no focus-ring token.

### 2. Numerals

Arabic-Indic (`٠-٩`) as PRD §7 specifies, and reference #1 confirms (`٢٣ مدينة`).
**Note the live production dashboard uses Western digits** — the two disagree. This build
follows the PRD; flip `NUMERALS` in `src/lib/num.ts` to compare.

### 3. Everything else

- **Mock data** — branches, coverage, and eligibility are invented (`src/store/store.ts`).
- **Mock activation** — 900 ms, failure rate configurable from the rail.
- **`٥٠ ر.س رصيد مجاني`** — transcribed from reference #2. **PRD §9 Q2 flags this as
  unconfirmed**; it renders as designed but must not ship without Partnerships sign-off.
- **Tayaar logo** — `ت` monogram placeholder, per PRD §7.
- **L12 is desktop-only** by design (the PRD marks it ❌ mobile); it renders as a card on
  small screens rather than a rail.
- **One shared copy set** across all 20 layouts, per PRD §9 Q1's recommendation, so
  activation-rate deltas are attributable to layout rather than wording.

## Verification

`npm run test:smoke` covers: the matrix cover, all 20 layouts rendering, the one-click
contract (activation without any `aria-modal` dialog), the rollback window, the gate flows
(F13/F14/F16) sampled across families, multi-branch flows (F8/F9/F18), a **full 400-combination
layout × flow sweep**, and axe-core WCAG 2.1 A/AA on six routes.
