# Checkout Verification · the three Drawers — REBUILT 16 Sep 2026

The Activity screen is already in the Cart Proposal file
(`fZB13ULQEXJmAOqK6reGsT`, Prototype page, node `45:635`). These three panels are what
**Change** and **Manage** open on it. They are now in the file:

| Frame | Node |
|---|---|
| `Drawer · Branch Details` | `78:1085` |
| `Drawer · Delivery Address` | `79:1412` |
| `Drawer · Business Documents` | `81:1747` |
| `Notes · Checkout Verification Drawers` | `84:2084` |

The first push of these three (`59:902`, `61:1237`, `63:1568`, `65:1921`) was no longer in the
file the next time it was opened — an undo or a version restore, most likely. These are the
rebuild, at new node ids, to the right of the Payment A screen and its notes.

What follows is the build order they were made from, kept as the record.

## Placement

Three frames on the same Prototype page, to the right of the Notes panel, laid out left to
right with a 120 gap, each 1440 × 1555 so it reads against the screen it covers:

| Frame | Panel size | Opens from |
|---|---|---|
| `Drawer · Branch Details` | Drawer `Size=md` | Branch Details → Change |
| `Drawer · Delivery Address` | Drawer `Size=md` | Delivery Address → Change |
| `Drawer · Business Documents` | Drawer `Size=lg` | Business Documents → Manage |

Each frame is the Activity screen cloned and dimmed under `color/scrim`, with the Drawer
organism instanced over it at `data-side=end`. Cloning keeps one source for the page beneath.

## Components to instance

Keys already resolved from the consuming file:

| Component | Key |
|---|---|
| Button (set) | `f89c7dc2e4fafea0a2b880738974191fed046a91` |
| Text Field (set) | `06cb3934fed03a39bba6021682427380026c1149` |
| Chip (set) | `bc9f285b333a42cfdfa6e191e95b66b5d0ccd544` |
| table/status (set) | `6392226f9026f4fa5afae7220d2b3f39e8f8c9e3` |
| Divider (set) | `da32758ae05ef66f8e2efb911496c527a2743ebb` |
| icon/save · check · view · refresh · delete · add · location | `96343352…`, `cc820c40…`, see the push log |

Resolved on the rebuild, by reading the DS file's own pages rather than one search at a time
(`search_design_system` clamps a batch to a single query):

| Component | Key |
|---|---|
| Drawer (set) | `e0e32ebee233b2a672282aea1047ce4b757f4f82` |
| Dialog Header (set) | `7b0e87f0782ff7d91b19919f3a4eb750df3112f3` |
| Dialog Actions (set) | `ffd5db0df62ff8b4bf7180d53da96890bae69636` |
| Phone Field (set) | `7651f92607321dd4716dfae60bd2a73bcac6c30a` |
| Select (set) | `3d3361a72c633f6fdfb08d715971f43af9636a2d` |
| File Upload (set) | `64d3cede0ad9d699404e4c46a318bc05a3975eb2` |
| Icon Button (set) | `fcf3039c69b8c0ecbc5678e1fd07924e0a445d66` |
| icon/save · check · view · refresh · add · close · file | `96343352…`, `cc820c40…`, `b5339d2c…`, `187d844c…`, `ac26774a…`, `e6dbb24d…`, `430d144e…` |
| color/scrim | `2f8e5f4658be591113f06c1274b5e740a45c12d5` |

## Content, verbatim from the prototype

### 1 · Branch Details (md)
- Header: **Branch Details**, close button (the organism's own, a sibling of the panel)
- Lead: Who the driver calls when the order arrives. Saved to your account.
- Text Field · **Branch Name** (required) — `Buyer`
- Phone Field · **Branch Phone** (required) — `+973` · `908070605`
- Text Field · **Branch Email** — `branch@highbaseco.com`
- Dialog Actions: `Cancel` (ghost, lg) · `Save Details` (filled, lg, leading icon/save)

### 2 · Delivery Address (md)
- Header: **Delivery Address**
- Lead: Where the order goes. The pin is what the driver navigates to.
- **Select Address Location** (required) — map tile, `Move pin` button top end, label
  `Pin saved · Block 460` bottom start, hint: Drag the pin or search — the fields below fill from it
- Select · **Country** — `Bahrain` · Select · **State / Province** — `Capital`
- Text Field · **City** — `Manama` · **Street Address** — `18`
- Text Field · **Building Name / Number** — `19` · **Postal Code** — `11111`
- Dialog Actions: `Cancel` · `Update Address` (filled, lg, leading icon/save)

### 3 · Business Documents (lg)
- Header: **Business Documents**
- Lead: Kept on your account and reviewed within one working day — you will not be asked again
  on the next order.
- Text Field · **CR Number** — `5056050560-1`
- **Commercial License (CR)** (required) + status `On file` — file card:
  `CR-5056050560-1.pdf`, `412 KB · added 12 Jan 2026`, actions `Preview` · `Replace` · remove
- **VAT registration** — link `+ Add a VAT certificate (optional)`, hint: Only if you want to
  reclaim VAT on the tax invoice
- **Personal ID Document** (required) + status `On file` — file card: `CPR-front.jpg`,
  `1.2 MB · added 12 Jan 2026`, same three actions
- Dialog Actions: `Done` (filled, lg, leading icon/check)

## Rules this push follows

- Every colour, spacing and radius bound to a Color, Spacing or Shape variable — no raw hex or px.
- Auto layout on every frame; the Drawer's close button stays a flex sibling of the panel, which
  is how the organism mirrors in RTL without a left/right value.
- The two-column grids inside a section's form stack in the panel, as they do in the prototype.
- Anything the library cannot express gets flagged in `FIGMA_PUSH_STATE.md`, not invented.


## What the push found

The Drawer organism could not be instanced with this content. Its Body is the Match My Price
sample — an Alert, a Summary, two Text Fields and a File Upload — with no slot and no
`INSTANCE_SWAP` property, so a consuming file cannot put its own fields inside it. Each panel here
is composed from the Drawer's own tokens (`radius/16`, `color/surface`, `spacing/20` body padding,
`spacing/16` gap, a `spacing/40` close at `radius/8` on `color/error`, panel widths 520 and 680)
and named for the variant it stands for.

The other gaps, as the rebuild measured them:

- **File Upload cannot express a file the buyer can act on.** Its uploaded variant is a drop zone
  with two sample rows, an Upload more pill and a max-limit line, and each row carries only a close
  icon. The prototype's on-file card is a row with Preview, Replace and remove and no drop zone
  above it, so the two cards are composed from the same tokens.
- **Dialog Actions has no one-button variant** (Buttons is 2 or 3), so Business Documents carries a
  Cancel the prototype does not have.
- **A document's state is not the order-status vocabulary.** "On file", "Required" and "Optional"
  are none of `table/status`'s six words and that set carries its word as a variant, so the state
  uses the Chip atom at `Style=neutral`. Chip has no success or warning style, so the prototype's
  tonal colour cannot be reproduced.
- **The panel widths are plain numbers.** 520 and 680 are `component/drawer/panel-width-*`, geometry
  tokens the published library does not expose — it publishes Color, Spacing and Shape only.
- **Correction to the first push.** It reported that Select never shows its Value node. It does:
  `State=selected` renders Value and hides Placeholder, probed here by setting a distinct
  placeholder string and reading back which node was visible. Country and State / Province use it.

All of these are logged in the design system's `FIGMA_PUSH_STATE.md` and repeated on the Notes
panel beside the frames.
