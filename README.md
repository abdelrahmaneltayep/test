# HIGHBASE / Salla design prototypes

Clickable prototypes built alongside the product documents they implement. Everything runs
in the browser with in-memory data — there is no backend.

## Prototypes

| Entry | Prototype | Document |
|---|---|---|
| `index.html` | Salla — branches & warehouses plan-limit upgrade nudge | — |
| `rfq.html` | HIGHBASE — Special Price Request & RFQ | [`docs/HIGHBASE-Special-Price-RFQ-PRD.md`](docs/HIGHBASE-Special-Price-RFQ-PRD.md) |

## Running

```
npm install
npm run dev        # both prototypes; open /index.html or /rfq.html
npm test           # domain + acceptance-criteria tests
npm run build      # builds both into dist/
npm run build:single   # rebuilds rfq-prototype.html, a single self-contained file
```

`rfq-prototype.html` is a committed, dependency-free build for offline review — open it
straight from disk and it runs. CSS and JS are inlined; the only external reference is the
Google Fonts stylesheet, and the page falls back to the system stack without a network.

## Special Price Request & RFQ

Three surfaces, switchable from the demo bar at the top:

- **Buyer · Marketplace** — the product grid and the product details page, each carrying
  the negotiation entry point, plus the request form: quantity, the explicit route choice,
  and that route's fields on one screen, with the lines already added summarised beneath.
- **Buyer · Dashboard** — the request list and the three-column original / asked / offered
  comparison, with accept, counter, decline and withdraw.
- **Seller · Dashboard** — the triage queue showing margin after the ask, and the
  line-by-line response surface with the proof panel and price-list write-back.

The demo bar also flips language and direction (English / Arabic RTL), turns Phase 2 on and
off, changes the auto-accept rule and the seller's permissions, and moves the simulated
**server clock** so SLA countdowns, offer expiry and the expiry sweep can be watched
happening.

### Visual design

The interface follows the live HIGHBASE product: the navy / blue / orange palette sampled
from it, the white marketplace navbar, the navy dashboard sidebar with its Purchasing →
RFQs grouping, and the same table, card, pill and button treatments. Typography is Inter
for UI, Jost for the wordmark and Cairo for Arabic.

On the product details page the negotiation action sits in the CTA row beside Add to Cart —
a blue outline button against the filled one — so a buyer weighing the price can challenge
it without hunting (AC-1.1). The card and the detail page share the same eligibility rules:
no entry point at all where the product is not negotiable, a deep link where an open
request already covers the SKU, and none where an agreed price is already in force.

### How the code maps to the PRD

The rules live in `src/rfq/domain/`, separate from the React surfaces, because they are
what the acceptance criteria are actually about:

| Module | Covers |
|---|---|
| `money.ts` | FR-1.8 integer minor units; EC-23 line-level rounding |
| `states.ts` | FR-3.1 the twelve states, FR-3.2 dual labels, FR-3.3 the transition table |
| `guardrails.ts` | FR-3.4a–h defaults and bounds |
| `clocks.ts` | FR-3.5 sweep, FR-3.6 business hours, EC-13/14/16/18 |
| `margin.ts` | FR-5.3 margin after the ask; EC-20 missing cost |
| `rules.ts` | US-19 auto-accept and floor; EC-21, EC-22 |
| `proof.ts` | FR-7 extraction and the three auto-checks; EC-25/27/32/33/34 |
| `serialize.ts` | A7 / FR-4.8 the actor boundary |
| `i18n.ts` | FR-11.1–11.3 localisation, including render-time history |

Every source comment names the requirement it implements, so a reviewer can read the code
against the PRD. The tests in `src/test/rfq.*.test.ts` are written the same way — one
`describe` per requirement — and cover the QA-critical edge cases listed in PRD §6.8.
