# PDV2-466 — Development hand-off

Quick Delivery activation: Mrsool as default provider, full auto-setup, KSA multi-branch
market linking. Reference implementation: this repo. Jira status untouched.

---

## 1. Interactive elements → Twilight components

Every element, the Twilight component it maps to, and non-default props.
Wrappers live in `src/components/twilight/index.tsx` — swapping their bodies for
`<s-*>` elements is mechanical; nothing above that layer moves.

| # | Element | Twilight component | Non-default props |
|---|---|---|---|
| 1 | Provider confirm card | `<s-panel>` | — |
| 2 | "المزوّد الافتراضي" chip | `<s-tag>` | `theme="secondary"` |
| 3 | "مفعّل مسبقاً" chip | `<s-tag>` | `theme="success"` |
| 4 | "سيُفعَّل تلقائياً" chip | `<s-tag>` | `theme="info"` ⚠ no hex — runtime resolves |
| 5 | "مسارات متعارضة" chip | `<s-tag>` | `theme="warning"` ⚠ no hex — runtime resolves |
| 6 | Route-conflict banner | `<s-alert-box>` | `theme="warning"`, `layout="default"`, icon `hgi-stroke hgi-alert-02` |
| 7 | "استبدال المسارات" | `<s-alert-box-action>` | `layout="btn"` `theme="warning"` |
| 8 | Branch list container | `<s-panel>` | `layout="relaxed"` |
| 9 | Branch row status chip | `<s-tag>` | `theme="success"` linked · `theme="info"` will-link |
| 10 | Empty state (0 KSA) | `<s-alert-box>` + `<s-button>` | `theme="warning"`; button `outlined` |
| 11 | Fulfilment auto-enable notice | `<s-alert-box>` | `theme="info"` |
| 12 | Market-linking notice | `<s-alert-box>` | `theme="info"` (will link) · `theme="secondary"` (already linked) |
| 13 | Multi-Branch enablement notice | `<s-alert-box>` | `theme="info"` |
| 14 | **Fees consent** (variant) | `<s-alert-box>` + `<s-toggle>` | alert `theme="warning"`; toggle `layout="start"` `wide` |
| 15 | Branch/warehouse picker | `<s-tags-input>` | chips use `--secondary` / `--secondary-100` |
| 15b | Setup disclosure | `<s-accordion>` | collapsed by default; header carries an `<s-tag>` count |
| 15c | Coverage radius | `<s-input>` | trailing unit at the inline-**end** (left in RTL) |
| 15d | Days selector | `<s-buttons-group>` | active item uses `--secondary` fill |
| 16 | Primary CTA | `<s-button>` | `theme="secondary"` `size="lg"` (the mint CTA) |
| 17 | Blocker message | plain `<p role="status">` | — |
| 18 | Activation progress bar | `<s-progress-bar>` | `label` `desc` `percentage` `show-percentage="true"` `size="md"` |
| 19 | Per-step row | `<s-panel>` + `<s-tag>` + `<s-icon>` | composed — **no Twilight stepper exists**, see §4 |
| 20 | Step status chip | `<s-tag>` | `default` pending · `info` running · `success` done · `danger` failed |
| 21 | Per-item (branch) row | `<s-list-item>` + `<s-icon>` | icons `hgi-tick-02` / `hgi-cancel-01` |
| 22 | Step failure banner | `<s-alert-box>` | `theme="danger"`, icon `hgi-stroke hgi-alert-02` |
| 23 | "إعادة محاولة هذه الخطوة فقط" | `<s-button>` | `theme="default"` `size="sm"` |
| 24 | Retained-steps callout | `<s-alert-box>` | `theme="secondary"` |
| 25 | Success result | `<s-panel>` + `<s-alert-box>` | alert `theme="secondary"` |
| 26 | Partial result | `<s-panel>` + `<s-alert-box>` | alert `theme="warning"` |

**Colour rule for the whole table:** `warning` and `info` have **no published hex**
in the DS kit. Pass the theme; never hard-code. See §5.

---

## 2. API calls each activation step implies

Steps are derived from merchant state in `src/domain/activationPlan.ts` — read that file
to know which of these fire for a given store.

| Step id | When it runs | Call | Granularity |
|---|---|---|---|
| `activate-mrsool` | `mrsool === 'inactive'` | `POST /couriers/mrsool/activate` | atomic |
| `apply-routes` | always | `PUT /couriers/mrsool/routes` body `{ preset: 'quick-delivery-default' }` | atomic |
| `enable-fulfilment` | KSA branch count **> 1** | `PATCH /branches/{id}/fulfilment` body `{ pickup: true, delivery: true }` | **per branch** |
| `link-market` | `multiMarkets === true` **and** unlinked KSA branches exist | `POST /markets/sa/branches` body `{ branch_ids: [...] }` | **per branch** |
| `enable-multi-branch` | `multiMarkets === false` | `POST /store/tools/multi-branch/enable` | atomic |

Reads the flow needs before the confirm screen renders:

| Call | Supplies |
|---|---|
| `GET /couriers/mrsool/status` | `inactive` \| `active` \| `conflicting-routes` |
| `GET /branches?country=SA` | the KSA-filtered branch list |
| `GET /store/features` | `multiMarkets` flag |
| `GET /markets/sa/branches` | which branches are already linked |
| `GET /couriers/mrsool/fees` ⚠ | **Blocked on Partnerships.** Drives the conditional fees variant. |

### Error contract the UI depends on

Per-item steps must return per-item results, not a single boolean:

```jsonc
// PATCH /branches/{id}/fulfilment — batched
{
  "results": [
    { "branch_id": "r", "ok": true },
    { "branch_id": "d", "ok": false, "error": "…" }   // ← surfaced per branch
  ]
}
```

Without per-item results the UI cannot show which branch failed, and retry degrades
to re-running the whole step. **This is the single most important requirement on the API.**

Retry semantics: `POST` the same step with **only the failed ids**. Every call must be
idempotent — a retry may re-send an id that actually succeeded on a network-dropped response.

---

## 2b. What PDV2-466 adds to the live screen

The three cards are SI-311/SI-323's. This ticket adds four things and nothing else:

| ⟨466⟩ | Addition | Where |
|---|---|---|
| 1 | Provider disclosure — which carrier is behind `بوليصات سلة`, and its state | inside the selected provider radio card |
| 2 | KSA-only branch filter, with excluded branches named | under the branch picker |
| 3 | On-demand setup disclosure; store-level consequences named while collapsed | above the launch bar |
| 4 | The auto-setup run triggered by `إطلاق الخدمة` | replaces the screen |

**Do not rename `بوليصات سلة`.** See the README section on the naming conflict — that is
an open decision, not something this implementation settles.

## 3. Component tree

```
App                                      ← wires harness to component; not shipped
├─ DevHarness                            ← DEV ONLY, rendered OUTSIDE the component
└─ QuickDeliveryActivation(state)        ← the component under test. Only prop: MerchantState
   │
   ├─ [phase: idle]
   │  ├─ ProviderConfirmCard(state)
   │  ├─ RouteConflictResolver           ← only when mrsool === 'conflicting-routes'
   │  ├─ BranchScopeList(state)          ← KSA filter + exclusion note + fulfilment rule
   │  ├─ MarketLinkingNotice(state)      ← link-market OR enable-multi-branch
   │  ├─ FeesConsent                     ← only when feesRequireConsent (variant)
   │  ├─ PlanPreview                     ← renders buildPlan(state)
   │  ├─ BlockerNotice                   ← only when blockerFor(...) !== null
   │  └─ CTA
   │
   ├─ [phase: running]
   │  └─ ActivationProgress(plan, run)
   │
   └─ [phase: succeeded | partial]
      ├─ ActivationResult(plan, run)
      └─ ActivationProgress(plan, run)   ← kept visible; the audit trail is the point
```

---

## 4. Composed, not component

Two surfaces have no Twilight equivalent and are compositions. Flagged so nobody
looks for a component that doesn't exist:

- **Per-step activation list** — `<s-progress-bar>` is a single bar with
  label/desc/percentage. There is no stepper or checklist component in the kit.
  Composed from `<s-panel>` + `<s-tag>` + icons.
- **Per-item branch rows** — `<s-list-item>` + `<s-icon>`, no dedicated result-row component.

Both are candidates to promote into the DS if this pattern recurs.

---

## 5. Token mapping — and what could not be mapped

Real, published values used (`src/styles/tokens.css`):

```
--primary --primary-100 --primary-400
--secondary --secondary-100
--gray-100 --gray-200 --gray-400 --gray-500
--dark --dark-100 --dark-200
--danger --success
--radius-lg --radius-xl --shadow-sm --font
```

Five items need a DS decision. Full detail in `src/tokens/twilight.ts` → `UNMAPPED`:

| # | Item | Finding |
|---|---|---|
| 1 | **Brand primary** | You confirmed `#004956`; the kit runtime ships `#004A57`. One-digit delta. Using yours — two sources disagree and one should be corrected. |
| 2 | **warning colour** | No published hex. Theme-only on button/tag/alert-box. |
| 3 | **info colour** | No published hex. Theme-only. |
| 4 | **success as a Button theme** | `--success` has a hex and `<s-tag theme="success">` works, but `<s-button>` has **no** success theme — the kit marks it Figma-only. The success CTA therefore uses `theme="default"`. |
| 5 | **`--dark-100` on `--gray-200`** | Measured **4.43** — fails WCAG AA for small text. Safe on white (4.74) and `--gray-100` (4.62) only. This build uses `--dark-200` (5.36), also a real token. Worth documenting the surface restriction. |

⚠ The `--xx-fallback-*` variables in `tokens.css` exist **only** because this prototype
does not load the Twilight runtime. They are deliberately ugly so they grep out.
Production must pass `theme="warning"` / `theme="info"` and delete them.

---

## 6. RTL

`dir="rtl"` on `<html>`. Directional glyphs (chevrons, back arrows) mirror via the
`Icon` wrapper's `mirror` prop; universal glyphs (✓ ✕ ⚠) do not. Layout uses logical
properties (`ps-*`, `me-*`, `start-*`) throughout — no `left`/`right`. Verified across
all 14 states.
