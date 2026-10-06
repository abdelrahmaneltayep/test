# Highbase — About Us page, ten options (prototype)

The current About Us is a modal opened from the footer link (recording, 2026-10-06). This prototype turns it into a
full marketplace page on the Highbase design system, with marketing's rewritten copy (`HIGHBASE_About_Us_Rewrite.md`)
used verbatim, and offers **twenty-one layout options** behind one switcher (1–10 from the marketplace and distributor references, 11–16 from Rylo, Column and Moneda, 17–21 illustration-led with new layouts for sections 01–05 and the Contact block). Section order was agreed on 2026-10-06:

1. Hero — what a buyer gets, with `Join as a Buyer` (primary) and `Join as a Supplier` (secondary); both work signed-out.
2. Trust band — facts only (see below).
3. What is HIGHBASE · 4. Who it's for · 5. How it works · 6. Why HIGHBASE (each point carries a concrete fact from the copy) ·
   7. Built for both sides · 8. Global trade (hidden until launch) · 9. Final CTA, then the contact and location block (Bahrain), then the DS Footer.

| | |
|---|---|
| Build | `node build.js <path-to-highbase-ds>` → `index.html`; add `--artifact` → `artifact.html` |
| Copy | `content.js` — the document's text, plus the trust facts, the contact block, and sample catalogue rows for option 5 |
| Sections | `sections.js` — one renderer per section and per hero; `build.js` composes the ten versions |
| Styles | `about.css` — tokens only; bare numbers are page geometry and icon boxes, marked `LAYOUT` |
| Switcher | prototype bar: option 1–10 (`#v3` deep-links), Desktop / Mobile (390×844 frame), Global trade hidden / shown |

## The twenty-one options

| # | Name | Inspiration | What differs |
|---|---|---|---|
| 1 | Editorial split | — | hero text beside the `welcome` illustration, calm white and tinted sections |
| 2 | Numbers first | JOOR | short centred hero, then a dark trust band |
| 3 | Two audiences | Faire | hero splits into a buyer card and a supplier card, each with its own CTA |
| 4 | Explainer | Amazon Business | "What is HIGHBASE?" as the H1, 720px reading column, pull-quote |
| 5 | Product led | — | device frame with real `hb-pcard` Product Cards (sample rows) |
| 6 | Reasons list | Uline | "Why HIGHBASE" opens the page as 01–04, fact chip per reason |
| 7 | Journey | — | three-node timeline (Register, Order, Track) carrying both sides |
| 8 | Dark hero | — | hero on `surface-dark` with the orange eyebrow; final CTA goes light to avoid two dark bands |
| 9 | Region first | Tradeling | Bahrain headquarters card beside the hero, dark trust band |
| 10 | Bento grid | — | mixed-size tiles for hero, facts, audiences, reasons and steps; sticky CTA bar on mobile |
| 11 | Mission | Rylo | one centred manifesto line, an illustration strip, the reasons as a values ladder |
| 12 | Declarations | Rylo | the copy's own sentences ("Nothing changes in your commercial relationships.", "Local trade is live today.") become full-width declarative bands |
| 13 | Plain statement | Column | conversational headline, then every section as a label-and-content ledger; facts as a blunt list |
| 14 | Snapshots | Column | candid polaroid cards for the five audiences beside the hero |
| 15 | Three pillars | Moneda | hero plus three pillar cards from the reasons, each with its fact |
| 16 | App first | Moneda | phone mock of the app beside the hero and the live "Download Our App Now" CTA |
| 17 | Zigzag | illustrated | sections 01–05 alternate text and a tinted illustration panel; contact as an illustrated band |
| 18 | Story | illustrated | three-illustration hero row, audience cards, vertical illustrated timeline, split both-sides panel; postcard contact |
| 19 | Poster | illustrated | full-bleed poster hero, chapters opened by a centred illustration; centred contact card |
| 20 | Side rail | illustrated | sticky 01–05 rail beside the sections; contact is a DS form (TextField + TextArea) |
| 21 | Mosaic | illustrated | three-illustration mosaic hero, big what-card, audience and reason cards; address card plus form |

## Trust band — facts only

You asked for real numbers and real people "only from the content I gave". The document contains neither, so the band
carries four facts that exist in the sources, each tagged in `content.js`: Bahrain HQ `(live, footer)`, the Gulf
`(doc)`, 3 registration steps `(live, modal)`, 0 changes to prices and credit terms `(doc)`. Send figures (suppliers,
buyers, orders, cities) and leadership names and the band takes them without a layout change. No leadership grid is
drawn until names exist.

## Decisions and proposals

- Page, not modal `(decision)`; header and footer are the DS organisms; "About Us" marked current in the footer.
- Illustrations in options 17–21 are mapped by meaning `(proposal)`: products = catalogue, team = audiences, cart = buyers, upload = suppliers, orders = tracking, success = no disruption, messages = fewer calls and the contact block, documents = real workflows, welcome = register.
- The contact form in options 20 and 21 is a prototype: submit shows a confirmation in place; nothing is sent.
- Icons per tile `(proposal)`; `phone` and `mail` keys were **added to the DS icon map** (Hugeicons `call`, `email-icon`) so the footer and contact block are no longer blank.
- The GCC flags row and the four-tab "Why you have to join" block from the modal are not carried over; the tabs became sections.
- Section 8 hidden at build time, toggled by the bar; it is self-contained for launch.
- Outlined CTA on dark bands uses a transparent ground `(proposal)` — the Button has no on-dark variant.
- Option 5's catalogue rows are prototype sample data, not live products.
- Arabic not built: copy pending from marketing and Noto Kufi Arabic is not installed here. CSS is logical-property only.
- The ten reference sites could not be fetched from this environment (egress blocked); the comparison was built from their indexed content.
