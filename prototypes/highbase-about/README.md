# Highbase — About Us page (prototype)

The current About Us is a modal opened from the footer link (recording, 2026-10-06). This prototype turns it into a
full marketplace page built on the Highbase design system, with the rewritten copy from marketing
(`HIGHBASE_About_Us_Rewrite.md`, 8 sections) used verbatim.

| | |
|---|---|
| Build | `node build.js <path-to-highbase-ds>` → `index.html`; add `--artifact` → `artifact.html` |
| Copy | `content.js` — the document's text, section by section |
| Styles | `about.css` — tokens only; bare numbers are page geometry (max-width, phone frame) and marked `LAYOUT` |
| Hosted copy | see the artifact link in the chat thread |

## What the page does

1. **Hero** — eyebrow, tagline as the H1, lede, the two CTAs (`Join as a Buyer` filled, `Join as a Supplier` outlined) and the `welcome` spot illustration.
2. **What is HIGHBASE** — prose plus the "nothing changes in your commercial relationships" sentence as a tinted callout.
3. **Who it's for** — five tiles with icons.
4. **How it works** — two cards (buyers / suppliers) with the `01 02 03` numerals carried over from the live "Registration steps" `(live)`.
5. **Built for both sides** — two cards with check lists; marketing's "verify the supplier copy" note kept as a small footnote.
6. **Global trade** — `hidden` by default (document: "publish at launch"); the prototype bar toggles it. It is a self-contained section with a `Coming soon` chip, so launch is a one-attribute change.
7. **Why HIGHBASE** — four tiles.
8. **Final CTA** — dark band on `surface-dark` (the footer colour) with both CTAs again, then the DS Footer with "About Us" marked current.

Desktop (≥1024) and compact layouts; the prototype bar previews the page in a 390×844 phone frame.

## Decisions and proposals

- **Page, not modal** `(decision, this request)` — reachable from the footer "About Us" link; header and footer are the DS organisms.
- Icons per audience / benefit tile `(proposal)` — `store`, `team`, `building`, `dashboard`, `truck`, `check`, `clock`, `view`, `globe`; swap freely, they are semantic keys.
- The GCC flags row and the "WHY YOU HAVE TO JOIN" four-tab block from the current modal are **not carried over** — the new copy has no flags section and the tabs became sections 4–5. Flag if marketing wants the flags back.
- Section 6 hidden at build time, shown by the bar `(file)` — the document says to publish it at launch.
- Final CTA band on `--hb-color-surface-dark` `(proposal)`; the outlined CTA there uses a transparent ground with the on-dark text colour, which the Button component has no variant for.
- Icon tiles use `primary-container-low` behind `primary` `(proposal)`; eyebrow numerals `(proposal)`.
- **Arabic not built** — copy is pending from marketing and Noto Kufi Arabic is not installed in this environment. The CSS uses logical properties throughout so the RTL pass is a content change.
- The footer's social, mail and phone glyphs are blank, as in the DS review page — those icons are not in the library yet.
