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
| **B · Confirm** | Compact cards with one line each; forms and zones only behind *Change* / *Manage*. Opens on a readiness banner and one primary. | Is this right? — and one button. | Returning buyers with everything on file — most orders. | A first-time buyer must open every card. |
| **C · Guided** | One question per screen, a step map beside it, one *Continue*; a review step before Place Order; *Why do we ask for this?* behind a disclosure. | One decision, nothing else. | Senior or infrequent buyers, and phones. | The longest path. |
| **D · Tabs** | The three sections are tabs over one pane — one pane at a time, all three visible and reachable in any order, each with its own status pill. | All three sections and their states, one section's detail. | Buyers arriving to change one specific thing, without walking a sequence. | Tabs read as parallel; a buyer may place the order without opening the one that needed attention. |
| **E · Checklist** | The page is a list of what is already done, ticked, value on each row. Nothing is a form until a row is expanded; a progress bar states how much is settled, and only what is outstanding is styled as work. | How ready the order is, and the one thing that is not. | Mixed accounts, and anyone who wants reassurance before committing. | Four rows of green can read as busy when nothing needs doing. |

Shared hierarchy: one headline role per page, one title role per section, labels in
`on-surface-variant`, values in `on-surface`; colour only on status pills and the single primary
Button; Cancel / Change are ghost or outlined.

## Rebuilding and checking

```
./assemble.sh                             # slices → body.html → build.js → the artifact
node audit.js                             # static checks, DS stylesheets verbatim
NODE_PATH=../node_modules node sweep.js   # contrast in both directions on all six screens
                                          # (with B's cards open), overflow at 1440 and 390,
                                          # and the A / B / C / D / E interaction paths
```

## Tagged (proposal)

- the review shell and annotation toggle
- `--proto-*` geometry, the accordion, card and guided-step compositions, the readiness banner —
  the system has no accordion, stepper, wizard, tab-pane or checklist pattern (Tabs is a molecule,
  but the pane, the readiness banner, the checklist row and the progress bar are page compositions)
- the `.disclose` text button and the `<details>` "Why do we ask for this?"
- the two transitions (accordion chevron, upload progress) — motion is undefined in the system
