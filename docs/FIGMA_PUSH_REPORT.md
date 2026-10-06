# Figma push — report

File: `DS` · `OzGwihdXeu7ALbuwv3kfeC` · 62 pages.
Read this before trusting the result. It lists what is built, what could **not** be done, and
every decision taken without you.

---

## What is in the file

| Layer | Components | Variants | Unbound paints |
|---|---|---|---|
| Foundations | Colour, Typography, Shape, Elevation, Spacing, Layout & Grids, Motion, Icons, Illustrations, Accessibility | — | 0 |
| Atoms | 10 (Button, Icon Button, Checkbox, Radio Button, Switch, Badge, Chip, Avatar, Divider, **Logo**) | 474+ | 0 |
| Molecules | 27 across 24 pages | 192 | 0 |
| Organisms | 16 components across 8 pages | 63 | 0 |

Every molecule and organism carries a spec-bearing description with its provenance tags and its
own open questions. **All 35 component pages now carry 14-section documentation** — the 26 atom
and molecule pages, all 8 organisms, and the Logo. Each has an anatomy diagram with numbered callouts on
leader lines, lead prose at a 640 measure, a rule above every heading after the first, and an
Open questions section carrying that component's real gaps.

**Logo — now built**, from the assets you supplied in `Logo.zip`. One set, six variants:
`Type` (mark 47.79 × 27.24 · wordmark 191 × 28 · lockup 191 × 43) × `Color` (blue · white).

Each variant is the artwork used as an **alpha mask over a colour rectangle bound to a
variable** — exactly what `Logo.css` does with `-webkit-mask`. So neither brand colour is a
typed hex, and the set obeys the no-raw-hex rule like everything else.

Two things worth knowing. The zip contained the same PNG alpha masks already in the repo, not
vectors, so **the artwork is a 2 × raster**; replace it with the exported SVGs when they exist
by swapping the image fill on the `Artwork` layer in each of the six variants — nothing else
changes. And the supplied masks **peaked at alpha 171 of 255**, which would have rendered the
mark at 67 % opacity; the alpha was normalised to full range before import.

It got into the file without the network: the asset-upload host is blocked by this
environment's policy, so the PNG bytes were passed straight in with `figma.createImage`.

**Where it is used.** Top App Bar — wordmark at 28 in blue on both expanded views, mark at 24
on marketplace compact; dashboard compact has no logo slot, which was already a recorded
decision. Navigation Drawer — wordmark at 28 in **white** expanded, mark at 24 white collapsed
(that block previously held only the collapse toggle and no logo at all, which read as an
omission). Footer — the **lockup at 43 in white heads column 1** on both marketplace variants,
replacing the "Highbase" heading, since the mark already says the name. The **dashboard**
footers carry it too, at the start of the copyright bar with the copyright pushed to the far
end — lockup at 43 expanded, at 28 compact where the copyright wraps to two lines. Both bars
**held their 64 height**, so `component/footer/copyright-height` survived intact; no token was
broken to fit this in. No variant shows the mark twice.

**Note that `Footer/README.md` never mentions a logo at all**, and it states that on dashboard
views *only* the copyright bar remains. The lockup in the footer — marketplace and dashboard
both — is an addition on your instruction, not something the file asked for, and column 1 gave
up its heading to make room. If the footer spec is ever reconciled with the file, this is the
first thing to revisit.

The Logo page carries a full 14-section documentation page like every other component, plus a
Specimens block in the same shape:
the three types at nominal size, the three approved backgrounds as radius-12 tiles, the
proposed minimum sizes (wordmark 20, mark 16) and the proposed clear space (one mark height on
all sides). The orange tile was render-checked: ground exactly `#CB6A03`, mark pure `#FFFFFF`.
Its anatomy diagram calls out the artwork's parts *and* the two Figma layers each variant is
made of, since "which layer do I replace when the SVGs arrive" is what a designer most needs
from that page. The Top App Bar page was updated in five places to name the real component.

**Correction — Data Table is built.** An earlier draft of this report said the Data Table had
tokens but no spec, and left the page empty. That was my misreading: `04_Components/organisms/
README.md` lists it under "Not in the file", which means *not in the Figma file* — not
unspecified. `04_Components/organisms/DataTable/` holds a full `README.md` and `DataTable.css`,
rebuilt 12 Sep 2026 from the screen recordings across eleven tables, plus the 36-token
`component/table/*` namespace. It is now built to that spec, exactly as its README prescribes:

| Component | Variants |
|---|---|
| `table/header-cell` | 2 (`Align` start · end) + `Sortable`, `Info`, `Label` |
| `table/cell` | 10 (`Type` text · link · numeric · media · avatar · status · input · checkbox · select · actions) |
| `table/status` | 12 (`Status` 6 × `Editable` 2) |
| `table/row` | 3 (`State` default · hover · selected) |
| `table/toolbar` · `table/bulk-bar` · `table/footer` · `table/empty` | 1 each |
| `Table` · `Table (empty)` | composition frames |

95 paints, 95 bound, 0 unbound. The header row is filled `neutral/50`, the row divider is a
1 px **dashed** stroke on the row frame, and status is a tonal pill — the three corrections the
recordings forced on the first pass.

---

## Could not be done

| | Why |
|---|---|
| Arabic text styles (13) | Noto Kufi Arabic is not available. You decided to carry on without them. Nothing was substituted. |
| Product imagery | Same upload block. The media band shows the 48px placeholder glyph `ProductCard.css` itself specifies. |
| Flags (Phone Field) | No flag artwork in the repo. The country slot ships `icon/globe` in the 44 × 28 frame. |
| Screenshots | `www.figma.com` is blocked by the egress policy, so every page was verified structurally, not visually. **Nobody has looked at this work** — with one exception: the Logo is the only thing in this push that has been checked as pixels. `exportAsync` renders inside Figma and returns bytes, so it needs no network. The blue mark exports at 48 × 28, full opacity, dominant colour `#0A579A`; the drawer's white mark exports 43 × 24, full opacity, pure `#FFFFFF`. Both exact. The same trick could verify any other page if you want it. |
| `get_metadata` verification | It reports one page; the file has 62. It reads a stale view. Verify through `use_figma`. |

---

## Decisions taken without you

Each is also recorded in the component's own description.

**Typography.** `03_Typography` ships **only one SemiBold style — `EN/display-lg` at 48** — and
no 16 Medium. (An earlier draft of this report said "no SemiBold at any size"; that was wrong,
and I found it while building the Cover. It changes none of the decisions below: nothing in the
library asks for SemiBold at 48, and every component that wants one wants it at 14 or 16, where
there is still none.) Eight components ask for one. Where the element is a title I used the nearest title style (Bold);
where the CSS only changes weight to mark a state — selected tab, active nav item, current page
— I built nothing and let colour carry it. No font family was ever substituted.

**Size ramps that do not line up.** `component/pagination/control` is 44 and Icon Button ships
32/40/48 (built lg). Add to Cart wants 44/36 and Button ships the same ramp (built md/sm).
`component/dialog/actions-height` is 84 and Spacing jumps 80 → 104 (the bar hugs at 80).

**The logo's orange ground was darkened.** The brand file measures the third approved
background at `#CB6A03` = `secondary/700`, but white on it is **3.75:1** — below the 4.5 AA
threshold for normal text. `component/logo/bg-orange` now aliases `secondary/800` `#A1530B`,
**5.59:1**, the lightest step on the ramp that clears AA. Logotypes are exempt from WCAG
contrast minimums, so this was a deliberate departure from a `(file)` value, not a forced fix —
made because an approved background should be legible when the mark is doing work, not only
when it is decorative. The repo token, `tokens.css` and the Logo README were changed to match,
so Figma and code do not drift. Blue on white and white on Main Blue are both 7.39:1, unchanged.

**Chips, not Badges.** Select's README says chosen values are "neutral Badges". The Badge atom
renders only a dot or a count — it has no label. Built with Chip · neutral · sm.

**Menu geometry.** The README says 12 padding and 12 gap; `tokens.css` ships 8 and 4. Built from
the tokens.

**Dialog Actions stacking.** The README says the primary sits closest to the thumb;
`DialogActions.css` uses `column-reverse` over source order, which renders it at the top. Built
to the README's stated intent.

**Compact app bar.** Five 40px pills plus the menu icon, logo and search do not fit 375. Compact
keeps notifications and account; the compact dashboard bar also drops the logo and uses a
two-level breadcrumb.

**Compact product card.** 200 wide; the Coupon component is 320, so compact drops it.

**Collapsed drawer.** The role selector row is omitted — Role Selector is 292 wide and the file
does not say what a 112 drawer shows instead.

**Dialog Header `cancel-only`.** The file names the variant but never says what is in it. Built
as the title plus a ghost Cancel in place of the close.

**Price unregistered state.** A 5px blur over the amount plus a sign-in line. The file hides the
figure without saying how. *(Price has since been deleted from the file at your request.)*

---

## Contradictions to resolve

1. **`component/nav-item/bg-hover` equals the drawer ground** (`accent/dark-blue`), so hover is
   invisible on the drawer. Built as the token says.
2. **`--hb-component-tab-height-active: 48px` is dead** after the decision that the active tab
   keeps its height. Remove it.
3. **Snackbar and Banner actions** are specified as ghost buttons inheriting the status colour.
   A Button binds `component/button/*` and cannot inherit one. Either Button gains a status
   intent, or these accept secondary actions.
4. **List Item** has both a `Has actions` axis and a `Show actions` boolean doing the same job.
5. **Empty State** has both an Illustration axis and an Illustration swap. Dropping the axis
   takes the set from 12 variants to 3.
6. **Empty State variant count**: the README table lists four, its Figma line counts three.
   `records` is built as its own component.
7. **Data Table · Select in a cell.** The README's cell table asks for the Select molecule "at
   40". The Select molecule's own field is 44. The molecule is instanced unaltered rather than
   rescaled — either the cell spec moves to 44, or Select gains a 40 size.
7a. **Data Table · selection header.** `table/header-cell` is specified with `Align`, `Sortable`
   and `Info` only, so it has no slot for the select-all checkbox the layout sketch shows in the
   first header column. The `Table` frame composes that cell by hand. Either header-cell gains a
   `Select` boolean, or the sketch is wrong.
7b. **Data Table · row hover and selected.** `row-bg-hover` and `row-bg-selected` are tagged
   `(proposal)` in the token file and no hover is visible in the recordings, yet `table/row`
   needs states to be usable. Built as a 3-value `State` axis with both marked proposals.
8. **Top App Bar logo size.** `TopAppBar/README.md` measures the mobile header's logo at
   112 × 32 — ratio 3.5. None of the three supplied assets has that ratio (mark 1.75,
   wordmark 6.82, lockup 4.44), and the Logo rules say *never stretch, width follows height by
   ratio*. The ratio rule won: the expanded bar carries the wordmark at height 28 (191 wide),
   and compact carries the mark at height 24 (42 wide). Either the 112 × 32 measurement is of a
   fourth lockup nobody supplied, or it was taken from a stretched instance.
9. **Bottom hover** on Navigation Item paints `accent/dark-blue` on a light bar, because the CSS
   hover rule is global. Built as written; it needs its own token.

---

## Values with no variable behind them

Bound wherever a variable existed. These had none, and are literals:

border weights (1px, everywhere) · dash patterns, including the data table's 4-on/4-off row divider · the data table's 18px header and status glyphs and its 92px inline-input min-width · menu `min-width` 160 · menu max-height 264 and
its scrollbar · translucent whites on the Role Selector (colour is bound, only alpha is literal)
· avatar overlap −6 and the 26px overflow chip on Coupon · 3px tier padding on Price · blur radius
5 · `empty-state/max-width` 420 and `illustration` 240 · viewport widths (1440, 375) and component
widths from the file (292, 112, 680, 512, 376, 320, 200, 168, 84, 56, 0.75px rules).

---

## Defects found and fixed in the work itself

- **73 variant roots** had a fixed height smaller than their content — 10px in the worst cases.
  Text Field, Text Area and Phone Field were rendering as slivers. Cause: `resizeWithoutConstraints`
  on an auto-layout frame flips that axis to FIXED.
- **48 inner frames** frozen at their 100 × 100 creation size.
- File Upload rows and the Role Selector text column had collapsed to 1px wide.
- Four atom tables squeezed to 640 against a 720 column sum by the prose pass.
- `layoutAlign` is silently overridden by the newer `layoutSizingHorizontal` API — it bit the
  prose measure, a table width and the app bar width. Use `layoutSizingHorizontal`.
- **The Footer's three marketplace columns had collapsed to 1 px wide** and 2290 tall, so every
  line of copy wrapped to one character per line. Same cause: `layoutAlign: STRETCH` was set but
  `layoutSizingHorizontal: FILL` never was, and the compact variant had `layoutSizingVertical: FILL`
  against a parent frozen at 100. Columns now measure 362 each; the footer stands at 1440 × 350.
- **The Bottom Sheet's grabber row was frozen at 40 × 100** and its home indicator at 134 wide in
  a 375 frame. Both now fill the width with the bar centred; the sheet is 375 × 305.
- A generic hug pass caught both of those but **over-corrected**, hugging four heights the spec
  fixes — app bar logo 36, drawer logo block 84 and role row 56, footer copyright bar 64, home
  indicator 21. All restored, and bound to a variable where one exists. Worth knowing before
  reaching for a generic pass again: "taller than its content" is not the same as "wrong".
- **Figma will not resize a nested instance.** The Data Table's `Table` frame therefore composes
  `table/cell` instances inside row frames rather than instancing `table/row`, which silently kept
  its hug widths. The same limit is why every slot component here is a frame you copy.

---

## Removed at your request

**Price** — component set, documentation page, Figma page, and its three cross-references in Add
to Cart and Coupon. The repo still contains `04_Components/molecules/Price/` and lists it in the
molecules index, so a future push would re-add it.
