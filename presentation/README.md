# HIGHBASE checkout — heuristic evaluation deck

Same 40 slides in two formats, both generated from `findings.js`:

- `HIGHBASE-checkout-evaluation.pptx` — PowerPoint, for presenting and editing.
- `highbase-checkout-findings.html` — web deck, for sharing as a link. Built
  on the **Highbase design system** (repo `abdelrahmaneltayep/highbase-ds`
  @ c29369a): `03_Tokens/dist/tokens.css` is inlined verbatim and every
  colour, size, radius and shadow in the deck layer binds a `--hb-*` token.
  Arrow keys or the on-screen controls to navigate, `O` for the slide grid,
  `#12` in the URL to deep-link a slide, and it prints one slide per page.
  Stacks and reflows on a phone.

Content: the 26 findings from the heuristic evaluation, one slide each, with
what happens today, what the prototype changes, and what the problem costs
commercially.

## Rebuilding

```
npm install pptxgenjs
node build.js HIGHBASE-checkout-evaluation.pptx
```

`findings.js` holds the 26 findings as data — edit the copy there rather than
in the generator. Severity and heuristic tags must stay in sync with the
`Evaluation` tab of `../highbase-b2b-checkout-proposal.html`.

## Before/after evidence (web deck only)

Each finding slide carries two screenshots of the same region:

- **before** — a frame from the recorded walkthrough of qa.highbasemarket.com
- **after** — the same region of `../highbase-b2b-checkout-proposal.html`

`evidence/` holds the cropped images, `shots.json` maps each finding id to its
pair, and `crops.py` regenerates the crops. The after images come from
full-page captures of the prototype plus measured region boxes, so both sides
get identical crop treatment (same aspect, same output width, same quality).
Rebuilding the deck inlines them as data URIs — the artifact CSP blocks
external images, so they cannot be referenced by URL.


## Design-system compliance (web deck)

`03_Tokens/dist/tokens.css` is inlined unchanged; the deck layer sits on top of
it and binds tokens only. Checks run on every build:

- no raw hex, no unbound `font-family` / `font-size`, no physical
  `left`/`right` — logical properties throughout
- spacing only from the 4-pt scale; radius only from the shape scale
- one shadow: `--hb-elevation-level-2`. Levels 1, 3, 4 and 5 have no values in
  the system and none were invented
- type is the 13 M3 roles from tokens.css — Public Sans (Latin), Noto Kufi
  Arabic (Arabic), nothing else
- severity renders as a tonal status pill (`error` / `warning` / `info`
  container + on-container) carrying both the number and the word, so colour is
  never the only signal
- every text node on all 40 slides is measured against its computed background;
  the build fails if any drops below its WCAG AA threshold
- RTL · Arabic check on every build: direction mirrors through logical
  properties, the type roles swap font and line-height, English runs resolve
  their own direction

### Tagged as (proposal)

Not covered by the system, and marked as such in the CSS:

- the presentation shell itself — slide canvas, the bottom control bar, the
  slide-grid overview. There is no deck component in Highbase
- `--deck-*` geometry: slide size, evidence-image aspect, chart column widths
- transitions. Motion is undefined in the system; the two here are placeholders
- `--hb-color-surface-dark-container` used as the edge on a dark slide. The
  system already carries this token as `(proposal)` — its exact step is
  unconfirmed
