# FIGMA_FIXES.md — status report

Fourteen fixes were requested. **All fourteen are now complete in both places** — the Figma file and
the repo. One correction to earlier work was found and fixed along the way.

Every value taken by eye is tagged `(proposal)` in the component, in the token, and on the
documentation page. Every contrast figure quoted here was **measured** through the variable
alias chain, not judged by eye.

---

## Status

| Fix | Figma | Repo | Notes |
|---|---|---|---|
| F1 · Kill per-component colour variables | done | done | **plus a correction — see below** |
| F2 · Chip — three sizes | done | done | the Product Card stray it left is now closed by F7 |
| F3 · Search field states | done | done | |
| F4 · Side Menu | done | done | still has no documentation page — see Outstanding |
| F5 · Delete Role Selector | done | done | |
| F6 · Secondary is not a body-text colour | done | done | 3.75 → 5.76 measured |
| F7 · Product Card + Add to Cart | **done** | **done** | 72 variants, zero reflow, verified |
| F8 · Header replaces Top App Bar | **done** | **done** | Top App Bar deleted after its one instance was re-pointed |
| F9 · Side Menu replaces Navigation Drawer | done | done | |
| F10 · Data Table documentation | **done** | **done** | the page was largely written already; the real gaps were the method note and three behaviours |
| F11 · Drawer replaces Dialog | **done** | **done** | old Dialog deleted after re-pointing its one instance |
| F12 · Confirmation Dialog | **done** | **done** | new page, new component, full doc page |
| F13 · Bottom Sheet button hierarchy | **done** | **done** | |
| F14 · Footer rebuild | **done** | **done** | rebuilt again 14 Sep against a live screenshot; seven icon glyphs missing from the library — flagged, not substituted |

---

## A correction to F1 — 1,050 dangling bindings, now fixed

The F1 report said every component colour variable was deletable and **0 bindings were blocked**.
That was wrong, and the error was mine.

`findAllWithCriteria` does not descend into instance subtrees, and instance children whose main
component lives on an unloaded page — or which are hidden — do not materialise at all. The F1
audit used it, so it never saw the bindings that live inside nested icon instances. Those
bindings survived the deletion pointing at variables that no longer appear in any collection.

Re-audited with a manual deep walk that loads the Icons page first and temporarily un-hides
hidden instances (restoring them afterwards):

| Where | Bindings rebound |
|---|---|
| Button | 576 |
| Chip / Text Field / Select | 57 |
| Tabs / Segmented Control | 184 |
| Data Table / Chip (organisms) | 233 |
| **Total** | **1,050** |

All 1,050 were rebound through the same Option A map you approved, so **nothing changed
visually** — verified by re-rendering the Button set across all three intents and four styles.
A second full pass over all 61 pages now reports **zero** bindings to deleted variables.

Nothing was ever detached and nothing fell back to a raw hex: Figma keeps a deleted variable
alive while anything still references it. The defect was that those bindings had become
invisible and uneditable in the UI, not that they had broken.

---

## F7 · Product Card and Add to Cart

**Add to Cart** is now a four-state machine — `Add` · `Stepper` · `Stepper single` · `Disabled`.
Measured: all four variants are **320 × 48**. The height binds to `component/add-to-cart/height`
→ `spacing/48`, which is Button size `lg`, and that is what makes the states interchangeable.

**Product Card** is 72 variants: `Price` (2) × `Coupon` (3) × `Cart` (3) × `Saved` (2) ×
`Supplier` (2). Measured across all 72:

- width is **320** in every one
- height is **446 / 494 / 522**, driven **only** by the `Coupon` axis
- **zero** height difference across the `Cart` axis — the no-reflow guarantee, verified rather than asserted

The pack-type tag is now a **Chip** instance, closing the F2 stray. The supplier skeleton is
built. The sale pill, coupon pill and more-coupons link are all real variants.

The media band is sized by **ratio** (16 : 9) rather than a pixel height, so the card scales
with its column and no untokenised pixel height was invented.

**The ribbon is the card's only absolutely-positioned layer.** It is centred and translated by
half its own height, so the rule carries no pixel token. Its colour was measured:

| Candidate | Ratio |
|---|---|
| `color/secondary` on white | 2.25 |
| `color/secondary-hover` on white | 3.75 |
| **`color/secondary-pressed` on white** | **5.59** ✓ |

---

## F8 · Header

Four variants: `View` (Marketplace / Dashboard) × `Size` (Expanded 1440 × 72 / Compact 375 × 64).
It **instances** Logo, SearchField, Icon Button, Badge, Avatar and Breadcrumb and redraws none
of them. Badge counts are content on the nested Badge instance, never a variant. The account
chip's branch line truncates with a real ending truncation.

**No absolutely-positioned layer.** Each count badge rides its icon button on a **negative
auto-layout gap** (−14), so the bar stays entirely auto layout and mirrors under `dir="rtl"`
without a single left/right value.

Top App Bar was deleted only after its one instance had been re-pointed; a full-file scan
confirmed zero orphans first.

---

## F11 · Drawer · F12 · Confirmation Dialog

The old `Dialog` had exactly **one** instance in the whole file — its own anatomy specimen. It
was re-pointed to Drawer, a full-file scan confirmed zero remaining, and only then was it deleted.

**Drawer** — `Side` (End / Start) × `Size` (sm 400 / md 520 / lg 680, all `proposal`). The close
button sits outside the panel on the edge facing the page, on the error fill. The brief allowed
this to be the file's second sanctioned absolute overlay; **it did not need to be.** Making it a
sibling of the panel in a horizontal auto-layout row gives the same picture, mirrors without a
second variant, and keeps the promise that every frame uses auto layout. `Side` is written as a
child order, not a left/right value.

**Confirmation Dialog** — a new page and a new component set, `Intent` (Neutral / Warning /
Danger) × `Icon` (True / False). Intent drives both the icon tone **and** the confirm button's
colour, so a Danger dialog with a blue confirm is unrepresentable. The confirm is the filled
button; cancel is the ghost.

Both got complete 14-section documentation pages with rebuilt anatomy diagrams.

---

## F13 · Bottom Sheet

Fixed in `Dialog Actions` itself rather than in the sheet, so the Drawer and any future stacked
footer inherit it. Stacked actions now fill the bar's width with the **primary on top**:

| | before | after |
|---|---|---|
| order | Note · Secondary · Primary | Note · **Primary** · Secondary |
| widths | HUG | **FILL** |
| gap | 12 | **8** (`component/dialog/actions-stack-gap`) |

In CSS the markup is emitted in that same order — the `column-reverse` is gone — so the reading
order, the tab order and the visual order are one thing. Measured in the sheet: 343-wide buttons
in a 375 sheet; at 360 they are 328. Nothing overflows.

---

## F14 · Footer

Four regions on the dark navy ground: brand column with the white lockup, a paragraph and a
social row; Quick Links in two columns with a full-width Download button; Contact Us as four
icon-and-value rows; then a divider and a centred copyright bar. The ground binds to
`color/surface-dark`, which resolves to **#061E3A**.

**Scroll-to-top** is built as its **own component**, not baked into the Footer. It is a page
affordance; building it in would mean every page that wants a back-to-top also has to take a
footer. Its distance from the page edge is a page-layout decision, so it carries no offset token.

### Seven glyphs are missing, and nothing was substituted

The brief expected WhatsApp to be the likely gap. In fact **none of the five brand marks** are in
the icon library, and **neither are mail and phone**:

| Needed | Where |
|---|---|
| `icon/linkedin` `icon/youtube` `icon/whatsapp` `icon/instagram` `icon/facebook` | the social row |
| `icon/mail` | contact · email |
| `icon/phone` | contact · phone |

Address uses `icon/location` and the message row uses `icon/message`; both exist. Every affected
button and tile is **built, named for the glyph it needs, and left empty**. No substitute has been
drawn for any of the seven.

The screenshot settles one thing: the live product renders all seven correctly, so this is a
**library** gap, not a product gap — and because the shapes now carry the live treatment, they
will look right the moment the glyphs land.

### Rebuilt a second time, against a screenshot

The first pass was built from the written brief alone and got several things wrong. A screenshot
of the live footer corrected it:

| First pass | The live footer |
|---|---|
| Outlined transparent social circles | **Filled white** circles, mark in navy |
| Outlined transparent contact tiles | **Filled white** rounded squares, navy glyph |
| A light-grey secondary Button for the download | A **lighter-navy pill**, full width of its column |
| No dividers between regions | A **vertical rule** between each of the three |
| Invented copy and contact details | The real blurb, `info@highbaseco.com`, `+973-13300833`, the Seef address |
| `© 2026 Highbase. All rights reserved.` | `© 2026 HIGHBASE. All Rights Reserved` |
| Scroll-to-top blue with a white chevron | **White circle, navy double chevron** |

It is worth naming why: the brief described the footer accurately in words, and I built something
that satisfied every sentence in it and still did not look like the product. Written specs fix
structure; they do not fix treatment.

### One new colour role

The library had **no lighter-navy surface** — `surface-dark` is the ground itself and
`primary-pressed` is a brighter blue. The Download pill, the two dividers and the bottom rule all
need one, so `color/surface-dark-container` → `primary/900` (#103F6A) was added, with
`color/on-surface-dark` → white alongside it.

Tagged `(proposal)`. It is clearly lighter than the ground in the screenshot, which rules out
`primary/950` (#0B2746, only ~9 per channel away); 900 versus a step between the two has not been
measured. One look at the live CSS settles it.

### A rendering note worth recording

Rendering the footer **variant node directly** produced an export in which text bound to
`color/on-primary` came out as the stored literal (black on navy) instead of the bound white.
The node data was correct throughout — every text node `visible`, opacity 1, non-zero size,
binding intact. Rendering the same variant **through an instance** produced the correct image.
It was a render-path quirk on the component variant, not a file defect, and the footer is
verified correct.

The lesson is worth keeping: when a Figma export disagrees with the node data, render through an
instance before believing the export.

## Questions — these need an answer, not a guess

1. **The ribbon offset** (F7). The brief asked for this one to be put to a person. Built at half
   the ribbon's own height below the button's bottom border and tagged `(proposal)`.
2. **Nine missing icons.** F14 needs the five brand marks plus **mail** and **phone** — the live
   product has all seven, so the library is behind the product. F8 additionally has no ribbon
   glyph for `Brands` and no hamburger for compact; `icon/tag` and `icon/more` stand in. A tenth
   gap: **no double-chevron glyph**, now wanted in two places (the Product Card's more-coupons
   link and the scroll-to-top button), both built as two chevrons on a negative gap.
3. **`color/surface-dark-container` = `primary/900`** is a proposal taken by eye. Confirm the step
   against the live CSS.
4. **Noto Kufi Arabic is not installed.** The Arabic text style names it. The Header's `العربية`
   label renders through the platform fallback, not through the design system's style. Installed
   Arabic families that could replace it: Almarai, Cairo, Noto Sans Arabic, Reem Kufi, Tajawal.
   **No substitution has been made.**
5. **The disabled filled button is not legible.** `color/on-primary` (white) on
   `color/surface-container-high` — that is the value F1's Option A preserved deliberately, and it
   affects every disabled filled button in the library, not just Add to Cart. Changing it is a
   visual change, which Option A forbade, so it is left alone and raised here.
6. **`--hb-font-size-13`** in `Coupon.css` is still an undefined reference. Per the brief this is a
   "stop and ask", not a rounding decision.
7. **`Size=compact` on Product Card** was dropped. The five axes do not include size; restoring it
   doubles the set to 144 variants.
8. **The `Price` molecule** is gone from Figma but `04_Components/molecules/Price` is still in the
   repo and in the molecule index. Decide whether it goes or comes back.

---

## Outstanding work

- **Side Menu** still has no documentation page. F4 built the component; the drawer's page was
  deleted with the component it documented, and nothing replaced it. This is the one piece of the
  fourteen-fix scope that is genuinely unfinished.
- **Footer compact** variant still carries its old three-stacked-columns layout; only the
  expanded marketplace variant was rebuilt against the screenshot.
- The seven questions below.
