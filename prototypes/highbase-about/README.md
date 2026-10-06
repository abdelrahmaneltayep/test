# Highbase — About Us page, ten options (prototype)

The current About Us is a modal opened from the footer link (recording, 2026-10-06). This prototype turns it into a
full marketplace page on the Highbase design system, with marketing's rewritten copy (`HIGHBASE_About_Us_Rewrite.md`)
used verbatim, and offers **ten layout options** behind one switcher. Section order was agreed on 2026-10-06:

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

## The ten options

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

## Trust band — facts only

You asked for real numbers and real people "only from the content I gave". The document contains neither, so the band
carries four facts that exist in the sources, each tagged in `content.js`: Bahrain HQ `(live, footer)`, the Gulf
`(doc)`, 3 registration steps `(live, modal)`, 0 changes to prices and credit terms `(doc)`. Send figures (suppliers,
buyers, orders, cities) and leadership names and the band takes them without a layout change. No leadership grid is
drawn until names exist.

## Decisions and proposals

- Page, not modal `(decision)`; header and footer are the DS organisms; "About Us" marked current in the footer.
- Icons per tile `(proposal)`; `phone` and `mail` keys were **added to the DS icon map** (Hugeicons `call`, `email-icon`) so the footer and contact block are no longer blank.
- The GCC flags row and the four-tab "Why you have to join" block from the modal are not carried over; the tabs became sections.
- Section 8 hidden at build time, toggled by the bar; it is self-contained for launch.
- Outlined CTA on dark bands uses a transparent ground `(proposal)` — the Button has no on-dark variant.
- Option 5's catalogue rows are prototype sample data, not live products.
- Arabic not built: copy pending from marketing and Noto Kufi Arabic is not installed here. CSS is logical-property only.
- The ten reference sites could not be fetched from this environment (egress blocked); the comparison was built from their indexed content.
