# HIGHBASE / Salla design prototypes

Clickable prototypes built alongside the product documents they implement. Everything runs
in the browser with in-memory data — there is no backend.

## Prototypes

| Entry | Prototype | Document |
|---|---|---|
| `index.html` | Salla — branches & warehouses plan-limit upgrade nudge | — |
| `rfq.html` | HIGHBASE — Special Price Request & RFQ | [`docs/HIGHBASE-Special-Price-RFQ-PRD.md`](docs/HIGHBASE-Special-Price-RFQ-PRD.md), [feature flow draft](docs/HIGHBASE-Special-Price-RFQ-Feature-Flow-Draft.md) |
| `variants.html` | HIGHBASE — design variant sheets | — |
| `stories.html` | HIGHBASE — user story grooming register | [`docs/HIGHBASE-Special-Price-RFQ-User-Stories.md`](docs/HIGHBASE-Special-Price-RFQ-User-Stories.md) |
| `flows.html` | HIGHBASE — user flows per story, by role | [`docs/HIGHBASE-Special-Price-RFQ-PRD.md`](docs/HIGHBASE-Special-Price-RFQ-PRD.md) |

## Running

```
npm install
npm run dev        # both prototypes; open /index.html or /rfq.html
npm test           # domain + acceptance-criteria tests
npm run build      # builds both into dist/
npm run build:single   # rebuilds the single-file prototypes for offline review
```

Each prototype has a committed, dependency-free single-file build for offline review —
`rfq-prototype.html`, `variants-prototype.html`, `stories-prototype.html`,
`flows-prototype.html`. Open any of them straight from disk and it runs. CSS and JS are inlined; the only external reference is the
Google Fonts stylesheet, and the page falls back to the system stack without a network.

## Special Price Request & RFQ

Three surfaces, switchable from the demo bar at the top:

- **Buyer · Marketplace** — the product grid and the product details page, each carrying
  the negotiation entry point, plus the request form: the route question first — a tab
  per route, "I have a price to match" (the default) and "Ask the seller to quote" — then
  quantity, then that route's fields. A request is one line; multi-line drafts still arrive
  through Re-request and are summarised at the foot of the form.
- **Buyer · Dashboard** — the request list, carrying each row's next step and its cancel,
  and the three-column original / asked / offered comparison behind it, with accept,
  counter, decline and withdraw.
- **Seller · Dashboard** — the triage queue, one row per request with its action, and the
  line-by-line response surface behind it carrying the SLA countdown, margin after the
  ask, the proof panel and the price-list write-back.

Both dashboards also carry two shared surfaces from the feature flow draft, reachable from
the sidebar:

- **Inbox** — Special Price Request · RFQ · Sent, for either role. A projection of the
  append-only history log rather than a stored feed, so Sent is the same events read from
  the other side and the three tabs partition the log rather than overlapping it. The
  sidebar badge and the bell count the same unread number.
- **Final Orders** — standard orders and negotiated ones in one list, split into Pending,
  Final Orders and Cancelled, each row carrying the old price against the agreed price. The
  order page states whether the order went through a negotiation and whether an invoice was
  submitted, and holds the whole back-and-forth; an HB Admin view names the document on
  record.

The order is a second aggregate that observes the negotiation and stores only whether the
buyer confirmed or cancelled — which is how the draft's "rejected → back to Pending with a
Cancel still available" holds without any request leaving a terminal state. See
[`docs/HIGHBASE-Draft-Coverage-Audit.md`](docs/HIGHBASE-Draft-Coverage-Audit.md) for the
section-by-section reading.

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

## Design variant sheets

`variants.html` is where component alternatives get compared side by side, separately from
the prototype so exploring an option never destabilises it. Each sheet renders real
specimens in the HIGHBASE system inside a deliberately plain frame, and annotates every
option with what it buys and what it costs — plus a flag where an option contradicts a
stated acceptance criterion.

The first sheet covers the product card's action row: ten arrangements of **Add** and
**Request special price** (which becomes **View request** once one is open), switchable
across request state, card width and reading direction, because those three are what
actually separate the layouts.

## User story grooming register

`stories.html` renders the 28 user stories generated from the original feature-flow draft.
A flat read buries what the document is actually for: the twenty places the draft is
silent, ambiguous or contradicts itself. So the register counts them, filters by them, and
flags them in colour where they bite — amber for a spec gap, red for one that blocks
estimation. The four blocking questions sit above the register, because the rest is not
safe to groom around them.

`docs/HIGHBASE-Special-Price-RFQ-User-Stories.md` is the document of record;
`src/stories/storiesData.ts` carries the same content as data so it can be filtered.
Keep the two in step when either changes.

## User flows

`flows.html` leads with two end-to-end flows — **Buyer, every case** and **Seller, every
case** — each covering every branch that role can land on, including the ones the rules
decide before anyone sees them and the paths that end without an order. The 23 per-story
flows sit behind a toggle for tracing a single story back to the PRD.

The master flows are vertical swimlanes: three lanes, Buyer / System / Seller, running top
to bottom. The lane a step sits in is who performs it, so a handoff is a lane crossing you
can see without reading a label. Each carries a short list of the guarantees that hold
across the whole flow — idempotent submission, the actor boundary, ordered auto-rules —
which are true everywhere and so are drawn nowhere.

Every diagram is inline SVG generated from data rather than drawn by hand, because each set
shares one grid and hand-placing them would not hold it: `src/flows/masterFlows.ts` with
`SwimlaneDiagram` for the two, `src/flows/flowsData.ts` with `FlowDiagram` for the 23.
Colour repeats the actor encoding for anyone scanning a single node out of context, and
blocked outcomes use a semantic red kept separate from the three role hues — it marks where
the system stops the flow rather than a person deciding to.

Three flows carry an amber note where the prototype has moved past the document: US-3
(route now preselected), US-6 (multi-line removed) and US-7 (review step collapsed). The
flows show the PRD, since that is what engineering estimates against.

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
