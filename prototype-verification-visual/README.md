# Checkout Verification — three visual versions

`highbase-verification-visual.html` is the published artifact: the Checkout Verification page
three times, each disclosing the same sections and values in a different way. Assembled the
same way as the other prototypes — `03_Tokens/dist/tokens.css` and 34 component stylesheets
inlined **verbatim** from `abdelrahmaneltayep/highbase-ds`, icons through the repo's `spriteFor()`.

Same data everywhere: Branch Details (Buyer · +973 908070605 · branch@highbaseco.com), Delivery
Address (Bahrain · Capital · Manama · 18 · 19 · 11111, pin saved), Business Documents (CR
5056050560-1 · Commercial License · Have VAT certificate → Tax Number + VAT Certificate · Personal
ID Document). Same edit and upload behaviour everywhere, from the previous proposal.

| | How it discloses | Buyer sees first | Best for |
|---|---|---|---|
| **A · Steps** | Accordion — one section open, the rest collapse to one line and a status pill. *Confirm & continue* walks down. | The whole task's shape, one section's detail. | Buyers who want the order of things; closest to today's page. |
| **B · Confirm** | Compact cards with one line each; forms and zones only behind *Change* / *Manage*. Opens on a readiness banner and one primary. | Is this right? — and one button. | Returning buyers with everything on file — most orders. |
| **C · Guided** | One question per screen, a step map beside it, one *Continue*; a review step before Place Order; *Why do we ask for this?* behind a disclosure. | One decision, nothing else. | Senior or infrequent buyers, and phones. |

Shared hierarchy: one headline role per page, one title role per section, labels in
`on-surface-variant`, values in `on-surface`; colour only on status pills and the single primary
Button; Cancel / Change are ghost or outlined.

## Rebuilding and checking

```
./assemble.sh                             # slices → body.html → build.js → the artifact
node audit.js                             # static checks, DS stylesheets verbatim
NODE_PATH=../node_modules node sweep.js   # contrast in both directions on all four screens
                                          # (with B's cards open), overflow at 1440 and 390,
                                          # and the A / B / C interaction paths
```

## Tagged (proposal)

- the review shell and annotation toggle
- `--proto-*` geometry, the accordion, card and guided-step compositions, the readiness banner —
  the system has no accordion, stepper or wizard pattern
- the `.disclose` text button and the `<details>` "Why do we ask for this?"
- the two transitions (accordion chevron, upload progress) — motion is undefined in the system
