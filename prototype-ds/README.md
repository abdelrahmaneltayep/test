# Highbase checkout prototype — built on the design system

`highbase-checkout-proposal.html` is the published artifact. It is assembled,
not hand-written: `03_Tokens/dist/tokens.css` and 29 component stylesheets are
inlined **verbatim** from `abdelrahmaneltayep/highbase-ds` @ `c29369a`, and the
icon symbols come from `05_Icons` through the repo's own `spriteFor()` helper —
the same mechanism the design-system review pages use.

## Rebuilding

```
./assemble.sh          # slices -> body.html, then build.js -> the artifact
```

`build.js` refuses to ship a stylesheet whose comments do not balance — an
unterminated comment silently kills a whole stylesheet, which has bitten the
design system before.

## Components used

Header · Data Table · Drawer · Empty State · File Upload · Add to Cart ·
Inline Alert · Banner · Snackbar · Text Field · Text Area · Select · Search ·
List Item · Page Header · Dialog Header · Dialog Actions · Button · Icon
Button · Chip · Checkbox · Radio Button · Badge · Divider · Tooltip ·
Scroll to Top.

Severity and line state render as the Data Table's status pill, mapped onto its
own vocabulary (`active` / `pending` / `cancelled` / `approved`) rather than by
adding new `data-status` values, which would mean changing the component in the
repo and in Figma.

## Tagged (proposal)

- the prototype review shell — the top bar, screen switcher and annotation pins
- `--proto-*` page geometry: page max width, summary rail width, hairline,
  thumbnail size
- `.hb-btn.proto-block` — the Highbase Button has no full-width variant, and
  stretching one is a page decision
- the two transitions in the page layer. Motion is undefined in the system

## Open decisions this prototype ran into

- **`Coupon.css` references `--hb-font-size-13`**, which does not exist. It has
  a `13px` fallback, so it renders, but 13 is off the type scale. Left as-is —
  the system marks this a stop-and-ask, not a rounding decision.
- **The disabled filled Button is not legible** (a known open issue). Rather
  than rely on it, a delivery day with no capacity renders as a status pill.
- **`color/surface-dark-container` is itself a proposal** and is used here for
  the review shell's border.
- **Noto Kufi Arabic is not installed**; the artifact loads it from Google
  Fonts so the RTL path renders in the system's own face for viewers. That
  sidesteps the symptom, it does not settle the decision.
- **`Price`** exists in the repo but not in Figma, so line pricing is composed
  from type roles rather than instancing it.
