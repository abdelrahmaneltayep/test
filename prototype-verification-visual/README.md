# Checkout Verification — five visual versions

`highbase-verification-visual.html` is the published artifact: the Checkout Verification page
five times, each disclosing the same sections and values in a different way. Assembled the
same way as the other prototypes — `03_Tokens/dist/tokens.css` and 35 component stylesheets
inlined **verbatim** from `abdelrahmaneltayep/highbase-ds`, icons through the repo's `spriteFor()`.

Same data everywhere: Branch Details (Buyer · +973 908070605 · branch@highbaseco.com), Delivery
Address (Bahrain · Capital · Manama · 18 · 19 · 11111, pin saved), Business Documents (CR
5056050560-1 · Commercial License · Have VAT certificate → Tax Number + VAT Certificate · Personal
ID Document). Same edit and upload behaviour everywhere, from the previous proposal.

| | How it discloses | Buyer sees first | Best for | Trade-off |
|---|---|---|---|---|
| **A · Steps** | Accordion — one section open, the rest collapse to one line and a status pill. *Confirm & continue* walks down. | The whole task's shape, one section's detail. | Buyers who want the order of things; closest to today's page. | Three clicks even when nothing needs changing. |
| **B · Confirm** | Each card's body is the data itself, read only, in one of fifteen preview styles (below). *Change* / *Manage* open the **Drawer** with only that section's fields; the page holds no form. | The actual values beside their status, and one button. | Returning buyers with everything on file — most orders. | Editing happens in a panel over the page, so several changes mean several openings. |
| **C · Guided** | One question per screen, a step map beside it, one *Continue*; a review step before Place Order; *Why do we ask for this?* behind a disclosure. | One decision, nothing else. | Senior or infrequent buyers, and phones. | The longest path. |
| **D · Tabs** | The three sections are tabs over one pane — one pane at a time, all three visible and reachable in any order, each with its own status pill. | All three sections and their states, one section's detail. | Buyers arriving to change one specific thing, without walking a sequence. | Tabs read as parallel; a buyer may place the order without opening the one that needed attention. |
| **E · Checklist** | The page is a list of what is already done, ticked, value on each row. Nothing is a form until a row is expanded; a progress bar states how much is settled, and only what is outstanding is styled as work. | How ready the order is, and the one thing that is not. | Mixed accounts, and anyone who wants reassurance before committing. | Four rows of green can read as busy when nothing needs doing. |

## B · fifteen ways to preview the section data

Every card in B shows the section's own data, read only, and every one of them hands editing
to the same Drawer. The switcher above the cards (review chrome, `(proposal)`) swaps between
fifteen treatments of that data. Five come from the page itself; five follow reference layouts
supplied for the purpose (an insurance card, a smart-home list, dashboard metrics, a payment
sheet, a cart summary); and five are the **List Item** molecule used five ways:

| | How it previews | Best for | Trade-off |
|---|---|---|---|
| **1 Facts** | Labelled values in a grid, with the avatar, map pin or document thumbnail beside them. | A buyer checking one particular value — every label is visible. | The most ink of the five; the card grows with the section. |
| **2 Rows** | One value per line, label at the start, value at the end, hairline between rows. | Reading top to bottom against a document on the desk. | A long list of rows reads as a form even though nothing is editable. |
| **3 As used** | The data in the shape it is used in: a contact block, a postal address as the driver reads it, documents as sheets. | Recognition rather than reading. | Without labels, a value in the wrong field is harder to spot. |
| **4 Summary** | Values as Chips on one or two lines, every section the same short height. | The returning buyer with nothing to change — the page fits above the fold. | Chips carry values without labels; detail needs the Drawer. |
| **5 Record** | The Data Table organism, two columns: Field and what is on your account. | Buyers who already read this data as a table in the dashboard. | Heavier than the data warrants, and the least mobile-friendly. |
| **6 Credential** | The section drawn as the document it stands for: portrait or thumbnail, a dated badge, an identifier that copies, then two columns of values. | Sections that are records — the branch on the account, the licence. | Borrows the authority of a real card; there is no QR code, because the icon library has none. |
| **7 Tiles** | One soft rounded row per value, a tinted icon tile at the start, label small above the value. | Touch and any width — rows stack without reflowing. | No phone or mail glyph exists, so tiles repeat the section's own icon. |
| **8 Highlights** | The two values that decide the order as Stat Cards, everything else on one line beneath. | The quickest read of the ten. | It chooses for the buyer; the rest is invisible until the Drawer opens. |
| **9 Options** | A bordered card per record, the one in use outlined and pilled, documents carrying Preview. | Accounts with more than one of something — a second address, a renewed licence. | Looks like a chooser and is not one; one record makes a lonely card. |
| **10 Receipt** | A summary sheet: thumbnail rows, value at the end, a rule, then the line that matters set large. | The last screen before paying — same voice as the order summary beside it. | Emphasis by size means one line wins; another value is then the smallest thing on the card. |
| **11 List** | The List Item molecule as built: leading icon, label, value beneath, status pill in the trailing slot. | The safest of the fifteen — a component buyers already meet in notifications and menus. | Every row looks equally important. |
| **12 Ledger** | The same component with no leading slot and the value in the trailing slot: one line per value, values aligned down the end edge. | Checking many values quickly; the alignment exposes an odd one. | The densest, and the least scannable on a phone. |
| **13 Activity · chosen** | What was saved and when, the date in the time slot, and a replaced document showing both files — the version it replaced beside the one now on file. No status pills: the row states it in words and the tint carries the exception. | Returning buyers asking whether anything changed since the last order. | Reports history, not the record; finding one value means reading a line. |
| **14 Actions** | Every row uses the actions slot: Copy an identifier, Preview a document, Upload or Change opening the Drawer at that section. | Doing one small thing without opening anything. | The busiest of the fifteen; three actions a row is a lot of blue. |
| **15 Grouped** | One list per section split by subheaders with a count — Where and Exactly where, Registration and Files. | Sections that keep growing: a fourth document, a second contact. | More structure than today's data needs. |

### What B ships with

B opens on **Activity**. Three things follow from choosing it:

- **No status pills**, on the rows or on the card headers. The line already says what happened
  (*saved*, *replaced*, *is missing*), the readiness banner answers whether the order can go, and
  a pill beside either would state it a second time. The exception still shows: an outstanding
  row is tinted and says what to do.
- **A replaced file shows before and after — on one row.** `docs.cr` is seeded with the version it
  replaced, and any upload over an existing file in the prototype moves that file to `prev` and
  becomes `state.lastReplaced`. Only that newest replacement opens out into a *Before* and *After*
  pair with both thumbnails, sizes and dates; an older one keeps the fact in its line and reads
  like every other row, so the card carries one case rather than a column of file pairs. Removing
  a document clears both.
- **Every document carries a Required or Optional tag** beside its name, in the component's top row.
  It is a neutral Chip, never a status pill: required-ness is what the document is, not how it is
  doing, so it does not reintroduce the state this preview drops.
- **The order breakdown is open.** The rail's *See the breakdown* details element carries `open` in
  B, so items, delivery, the coupon and VAT are on screen before the buyer commits, not one click
  behind a summary.

The List Item five carry one prototype-layer override, noted in `head.html`: the component paints
its text slot in `on-surface-variant`, which is right for a notification's supporting line and
wrong for a value being checked, so the label takes the title slot and the value is restored to
`on-surface`. Everything else is the component's own markup — lead, body, top, title, time, text,
actions, trail — inside `.hb-list`.

Chosen for B: **Activity**. The rest stay switchable in the prototype for comparison.
Earlier recommendation, kept for the record: **Facts** on the storefront, **Summary** at compact width, **Tiles** for phones,
**Receipt** on this page specifically because it matches the order summary next to it, **As used**
as the one to put in front of buyers, **Record** in the dashboard. Among the List Item five,
**List** ships safest, **Actions** helps the buyer who came to change one thing, and **Grouped**
is the only one that survives a section growing past six values. Status in every style is the system's
status pill with its fixed vocabulary — the Chip atom has no success or warning style and none
was invented.

Shared hierarchy: one headline role per page, one title role per section, labels in
`on-surface-variant`, values in `on-surface`; colour only on status pills and the single primary
Button; Cancel / Change are ghost or outlined.

## Rebuilding and checking

```
./assemble.sh                             # slices → body.html → build.js → the artifact
node audit.js                             # static checks, DS stylesheets verbatim
NODE_PATH=../node_modules node sweep.js   # contrast in both directions on all six screens
                                          # (each of B's fifteen preview styles and its three
                                          # Drawers), overflow at 1440 and 390,
                                          # and the A / B / C / D / E interaction paths
```

## Tagged (proposal)

- the review shell, the annotation toggle and B's preview-style switcher
- `--proto-*` geometry, the accordion, card and guided-step compositions, the readiness banner —
  the system has no accordion, stepper, wizard, tab-pane or checklist pattern (Tabs is a molecule
  and the Drawer an organism, both used as built, but the pane, the fact grid, the document tile,
  the readiness banner, the checklist row and the progress bar are page compositions)
- the `.disclose` text button and the `<details>` "Why do we ask for this?"
- the two transitions (accordion chevron, upload progress) — motion is undefined in the system
