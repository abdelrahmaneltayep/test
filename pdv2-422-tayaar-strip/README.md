# PDV2-422 · Tayaar strip — 4 design options × every case

Decision aid for the contextual Tayaar cross-sell inside **«شحن خاص بمتجرك»** in the
Quick Delivery activation flow. Four visual treatments of the same strip, each playable
against every case in the brief.

```bash
npm install && npm run dev
npm run build && npm run preview
npm run test:smoke                # needs preview on :4175
```

## The two switchers

**الخيار** — four treatments, plus **▦ مقارنة الأربعة** which stacks all four at the width
they actually occupy inside the radio card. The surrounding form is identical in all four,
so the compare view shows only what varies.

| | Fill | App icon | Headline | Reads as |
|---|---|---|---|---|
| **A** | Mint | ✓ | إدارة المناديب باحترافية… | A featured offer inside the form — highest visual weight |
| **B** | Mint | ✗ | طيّار جاهز لإدارة مناديبك | Same weight, product-led rather than capability-led |
| **C** | White + border | ✓ | إدارة المناديب باحترافية… | A subordinate card, not an offer — medium weight |
| **D** | Flush + hairline rule | ✓ | إدارة المناديب باحترافية… | Another field in the form — lowest weight |

**الحالة** — 14 cases, grouped by the story they come from. Each carries the requirement
line it exists to satisfy, shown in the strip under the header.

## Cases, traced to the brief

| Story | Cases |
|---|---|
| **ST1** — contextual card | default offer · already installed · multi-branch (one account across branches) |
| **ST2** — one-week trial activation | activating (in-dashboard, no redirect) · activation failed |
| **ST3** — post-activation | Tayaar as the method satisfying the two-hour promise |
| **ST4** — trial lifecycle | started · days remaining · ending soon · ended · paid from 5 SAR · trial already used |
| **Scope** | Pro/Special plan gate · external carrier (no strip at all) |

Every case renders in every option — 56 combinations, all verified.

## Design decisions worth arguing about

**No statistics anywhere.** The brief's closing Note makes every Tayaar figure
(error reduction, delivery time) a launch blocker pending Data + Partnerships. The copy is
built to persuade without any, so the strip ships regardless of that review's outcome. The
suite asserts no percentage appears.

**The external-carrier case renders nothing.** The brief says the non-own-courier provider
flow is unchanged, so "no strip" is a designed state, not an omission.

**`trial-ended` does not remove the branch from Quick Delivery** — it withholds the two-hour
promise only. That is the brief's **open question 3**, unresolved; the case carries a visible
note flagging it as a PM decision rather than settling it silently.

## Known deviations

- **Tayaar icon is a placeholder** paper-plane mark, not the real asset (pending Partnerships).
- **Five tokens corrected for contrast.** Four in `src/styles/tokens.css` (carried from the
  v1.4 addendum: `text-tertiary`, `text-secondary`, `warning-700`); plus `danger-500` as a
  **button fill** measures 4.13 with white text, so the danger button uses `danger-700` (7.56).
  `danger-500` is still correct as a border or accent.
- **Numerals** are Arabic-Indic per the PRD and the reference designs. The live production
  dashboard uses Western digits — flip `NUMERALS` in `src/lib/num.ts` to compare.
- **No real activation.** Buttons show a toast saying so; this is a design surface, not a flow.
- **Mock data** — three branches, fixed dates.

## Verification

`npm run test:smoke` — 24 assertions: the form is identical across options, all 56
option × case combinations render, each case satisfies its story's requirement
(plan gate, no-statistics, no half-activated state, the three promise capabilities,
no auto-charge, branches retained after trial end), the compare view honours the selected
case, and **zero axe WCAG 2.1 A/AA violations**.
