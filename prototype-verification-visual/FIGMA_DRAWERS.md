# Checkout Verification · the three Drawers, ready to push

The Activity screen is already in the Cart Proposal file
(`fZB13ULQEXJmAOqK6reGsT`, Prototype page, node `45:635`). These three panels are what
**Change** and **Manage** open on it. This file is the build order for them, written while the
Figma connection was down so the push is one step when it returns.

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

Still to resolve on the DS file when the connection returns: **Drawer**, **Dialog Header**,
**Dialog Actions**, **Phone Field**, **Select**, **File Upload**. All six exist in the library;
none has been instanced from this file yet, so their keys are not cached here.

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
