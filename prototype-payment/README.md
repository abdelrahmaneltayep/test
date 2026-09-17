# Payment confirmation — three versions

`highbase-payment-proposal.html` is the published artifact: the screen a buyer lands on after
placing an order with Highbase Payment, three times over. Assembled the same way as the other
prototypes — `03_Tokens/dist/tokens.css` and 30 component stylesheets inlined **verbatim** from
`abdelrahmaneltayep/highbase-ds`, icons through the repo's `spriteFor()`.

Same order in all three: `ORD-1788951602914`, placed 9 Sep 2026 · 11:00, BHD 12.755, three lines
from Al Manar Trading, delivery Mon 14 Sep. Same bank details, same receipt upload, same status
vocabulary. What differs is what the buyer sees first and what is held back.

## What the live page does, and what these change

The live page confirms the order, prints the bank details and the QR side by side, and hides the
receipt upload behind **Track Your Order**. The buyer is told what happened but not what to do —
which is what the voice note described as "the flow is not clear, and I cannot do anything".

- **The amount leads.** It is the largest type on every version, with its own copy button. On the
  live page the total appears twice in body type and the eye has nothing to land on.
- **A does not ask for the receipt at all** (PM, 17 Sep): the buyer uploads it from inside the order,
  so checkout keeps one job — the transfer. B and C still take the file on the page, kept for comparison.
- **The order status says where the payment stands** — Awaiting your transfer · Waiting for your
  receipt · Payment under review — in the system's own status vocabulary.
- **The QR earns its space in A**, which gives it a column at scanning size (224 against the 148 the
  others use); B holds it behind one line, C gives it a tab.
- **Copy is on every value** a buyer has to retype into a banking app, and on all of them at once.

| | How it discloses | Buyer sees first | Best for | Trade-off |
|---|---|---|---|---|
| **A · One thing to do** | The confirmation drops to a line; the panel is the amount and the account on one side, the QR at scanning size on the other, and one primary button — Track your order. No receipt is asked for. | How much to send, where, and the code to scan. | The common case — pay in the bank app or scan, then leave. | The confirmation is quiet, and nothing acknowledges the transfer itself. |
| **B · Three steps** | A four-step timeline, one step open at a time, carrying that step's work. | Where they are in the job. | First-time buyers, and phones. | Two clicks to see everything; taller than the work. |
| **C · Pay and prove** | Two panels at once — pay left with a Tabs molecule for bank or QR, prove right with the upload live from the first second — and the tracker beneath. | Both halves of the job. | Buyers paying on a second screen. | The busiest of the three; two primary actions. |

Recommendation: **A** on the storefront, **B** for a buyer's first Highbase payment and on compact
widths, **C** where two screens are the norm. C's bank-or-QR tabs are worth keeping whichever ships.

## Rebuilding and checking

```
./assemble.sh                             # slices → body.html → build.js → the artifact
node audit.js                             # static checks, DS stylesheets verbatim
NODE_PATH=../node_modules node sweep.js   # contrast in both directions on all four screens
                                          # (with the QR open), overflow at 1440 and 390, and
                                          # the A / B / C interaction paths
node shots.js                             # screenshots of the three versions and the Compare
```

## Tagged (proposal)

- The **QR frame is a placeholder at its real size** in all three, A's simply larger. The prototype cannot generate a scannable
  code and does not fake one; the caption says where the live code comes from.
- The **step timeline, the amount block and the tracker** are page compositions — the system has
  no stepper, no amount block and no tracker.
- **Track your order** and **Go to marketplace** are inert: this prototype is one screen of the
  flow, not the order page.
- The two **transitions** (the disclosure chevron, the upload progress bar) are placeholders —
  motion is undefined in the system.
- The amount uses **headline-lg**: the system ships `display-lg` and the headline roles but no
  `display-sm`, and none was invented.
