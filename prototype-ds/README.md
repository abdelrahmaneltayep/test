# Highbase checkout prototype — built on the design system

`highbase-checkout-proposal.html` is the published artifact. It is assembled,
not hand-written: `03_Tokens/dist/tokens.css` and 32 component stylesheets are
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

## Checking

```
node audit.js                          # static: raw hex, physical left/right,
                                       # off-scale spacing, dangling token and
                                       # sprite refs, balanced comments, and that
                                       # each DS stylesheet is embedded verbatim
NODE_PATH=../node_modules node sweep.js # in a browser: every text node measured
                                       # against its computed background on all
                                       # four screens in both directions, RTL
                                       # mirroring, no horizontal page scroll,
                                       # and the interaction suite
```

`wrap.js` is the only place the artifact gets wrapped in a document for testing.
Three separate diagnostics read a stale wrapper during this pass, so every
checker requires it rather than assuming the file is current.

## The page is Header — body — Footer

All three bands are real organisms, not page-local markup.

**Header** is composed exactly as `organisms/Header/build-demo.js` composes it:
the compact menu trigger, the **Logo** atom, two `hb-header__pill` nav triggers
(Categories with its chevron, Brands), the **Search** molecule taking the
remaining width, the action cluster where each count **Badge** rides its **Icon
Button** on the component's negative flex gap — not on an absolute layer — the
language switch, and the account chip with an **Avatar**, the name and a
truncating branch line. `data-size` is a component axis, so the page sets it at
the system's own breakpoint: below 744 the Header goes `compact`, the Logo drops
from wordmark to mark, the Avatar from 40 to 32, the Search declares its
`compressed` variant, and gift and messages collapse through `data-collapse`.

**Body** is the four screens, unchanged in composition from the previous pass.

**Footer** is the `organisms/Footer` organism at `data-view="marketplace"` on
cart, confirmation and the evaluation sheet, and at `data-view="dashboard"` —
the copyright bar alone — on checkout. That is the component's own variant used
for a checkout convention: fewer exits on the one screen where a buyer is
committing. **Scroll to Top** is its own organism, as the system insists, so the
page owns its offset from the edge.

## Components used

Header · Footer · Data Table · Drawer · Empty State · Scroll to Top · File
Upload · Add to Cart · Inline Alert · Banner · Snackbar · Text Field · Text
Area · Select · Search · List Item · Page Header · Dialog Header · Dialog
Actions · Logo · Avatar · Button · Icon Button · Chip · Checkbox · Radio
Button · Badge · Divider · Tooltip.

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
- `--proto-footer-logo: 43` — the Logo README proposes 43 for the footer lockup
  and asks for it to be confirmed
- `--proto-cart-table-min: 784` — the width the cart columns need before they
  collide; a page decision, like the column widths themselves
- the Header's compact menu trigger is shown only at `data-size="compact"`; the
  component defines the collapse but not this trigger's visibility
- the review bar re-colours its own Buttons against `surface-dark` (see below)

## Found while building this pass — reported, not silently fixed

- **The count Badge fails AA.** `hb-badge` is `on-primary` (white) over
  `color/primary-light` (`#188bdf`) — **3.62 : 1** at 10 px. It is held at
  `color/primary` here (5.30 : 1) so the Header is legible, tagged
  `(proposal)`; the fix belongs in `atoms/Badge`.
- **The Button atom is unusable on a dark ground.** Every intent resolves to a
  colour meant for `surface`: primary ghost on `surface-dark` measures
  **2.27 : 1**, and an outlined Button keeps its white fill, so a white label on
  it is **1 : 1**. No Highbase product surface puts a Button on dark, so this is
  scoped to the review bar — but the gap is real if a dark surface ever needs one.
- **The Data Table's scroller does not contain its table.** With the table wider
  than the scroller, the scroller clips it correctly *and* the whole page still
  scrolls sideways behind it. Reproduced in Chromium's new headless as well as
  the shell; only paint containment on the scroller cures it. Applied here at
  compact; it belongs in `organisms/DataTable`. Cost: an annotation tooltip
  inside a cell is clipped at that width.
- **The Footer ships `Leave us a message` as a non-interactive `span`**, though
  the live storefront and the component's own README present it as a link with a
  trailing chevron. It is a link here, which needs the same colour and
  underline reset the Quick Links get.
- **`.hb-footer__gap`** — the note style the Footer uses to flag its missing
  glyphs — is `surface-dark-container` on `surface-dark`, **1.55 : 1**. It is not
  used here; the missing glyphs are flagged through the prototype's own
  annotation pins instead.

## Seven glyphs the Footer still needs

Built, named, and left empty — nothing substituted, per the system's rule:
`icon/linkedin` · `icon/youtube` · `icon/whatsapp` · `icon/instagram` ·
`icon/facebook` on the social row, and `icon/mail` · `icon/phone` on the contact
tiles. The live product renders all seven, so this is a library gap. Annotation
pins 7 and 8 say so on the page itself.

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
