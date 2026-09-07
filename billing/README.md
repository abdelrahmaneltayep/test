# Highbase Billing Module — prototype

Open `index.html`. Double-click it; there is no build step and no server.

Plain HTML, CSS and vanilla JS. Classic scripts rather than ES modules, deliberately: the
brief asks for both "ES modules loaded directly" and "opened directly from the filesystem",
and browsers refuse module scripts over `file://` because a file origin is opaque to CORS.
A prototype that has to be served is a prototype nobody double-clicks, so the intent won
over the mechanism — one global, `HB`, plus a shim so the tests also run headless.

## What it is for

Highbase's seller statement shows one balance. That single number is wrong in three ways,
and every screen here exists to make one of them visible:

1. **Some orders are collected by the seller** — the money never reaches Highbase, so the
   commission on them is a claim, not a deduction. → `Your Dues`
2. **Some orders are on credit** — nobody has collected yet, so they are neither held nor
   owed. → `Awaiting buyer`
3. **The ledger contains sign errors.** `RET-1007` was filed as a sale and overstates the
   book by **291.000**. → the admin reconciliation control

## Files

| File | What it holds |
|---|---|
| `data.js` | The ledger and every derivation. **The point of the prototype.** |
| `selftest.js` | The acceptance assertions. Runs on load; also runs headless. |
| `strings.js` | Every display string, so an Arabic RTL pass is a change, not a rewrite. |
| `ui.js` | Shared components — money renderer, tables, drawer, router, shell. |
| `styles.css` | The design system. |
| `index.html` | Role picker, and where the modes are set before entering a surface. |
| `buyer.html` · `seller.html` · `admin.html` | The three surfaces. |

Every figure on every screen comes out of `data.js`. Nothing is stored, and no total is
written down — so the seller's wallet and the admin's exposure report cannot disagree.

## Running the tests

    node -e "require('./billing/selftest.js').run()"

52 assertions, all passing.

One figure in the brief was wrong and has been corrected: **#1088's payable is 54.600, not
56.400.** The brief's arithmetic netted the 3.600 of dues but omitted ORD-3003's own 1.800
of commission, and that order is Highbase-collected and immediate, so it accrues like any
other. See `BRIEF-CORRECTIONS.md` for the two paste-ready edits and the verification that
nothing else moves.

## The four modes

All four ride on the query string, so a link to a screen carries the assumptions it was
taken under — a screenshot can be traced back to the mode it was taken in. When any is off
its default, a strip across the top of every screen names it.

| Mode | Values | What it changes |
|---|---|---|
| `risk` | `agent` · `guarantor` | **Not a display option.** Which postings exist, which orders enter a run, and who is exposed. #1088 releases 54.600 as an agent and 345.600 as a guarantor. |
| `filing` | `corrected` · `as_filed` | Reproduces the RET-1007 sign error that is in the book today. |
| `actor` | `ops` · `finance` | Admin only. Ops issues and corrects; Finance approves and pays. |
| `today` | any date | Buyer only. Every invoice sub-state and aging bucket is a statement about now. |

Plus `?seller=` and `?buyer=` on their surfaces, and `?state=loading|error` on any of them.

## Things to look at

- **Seller wallet** (`seller.html#/wallet`) — the four states. Switch to Muharraq Cold
  Store for `Held`, Sitra Industrial Tools for `Awaiting buyer`, or Seef Steel Fabricators
  to see a part-collected credit order sitting in both `Your Balance` and `Awaiting buyer`
  at once.
- **The rate-card claim** (`admin.html#/rate-cards`) — 3% is contractual, and the table
  underneath sizes what the withdrawn card still costs.
- **A part-paid invoice** (`buyer.html?buyer=B-204#/invoices`) — 165.000 of 330.000 paid.
  The same 165.000 shows as the buyer's outstanding balance, as half the commission
  accrued on the seller's ledger, and as the remainder still awaiting.
- **Reconciliation control** (`admin.html?filing=as_filed#/control`) — the proof screen.
  It names `RET-1007` and splits the error into its two legs.
- **A refused run** (`admin.html#/runs/1067-jan`) — the book asks for 81.300, Highbase
  holds 81.000, and the run does not go out short.
- **Seller exposure** (`admin.html#/exposure`) — Riffa Building Materials, 159.000 of
  commission earned and no cash to net it against.
- **Checkout** (`buyer.html#/checkout`) — the decision the whole module turns on, and the
  one that today is not recorded as a billing fact at all.

Turn on **Design notes** in the sidebar to see what rule each screen implements.

## Example data

Everything is derived from the seed in `data.js`. Four things in it are marked
`exampleData` and exist only so a state can be reviewed. Each carries exactly one state
the brief's own four sellers could not reach:

- **Seller #1121 Muharraq Cold Store** — one delivery-unconfirmed order, so `Held` has a
  value. Every seller in the brief has all deliveries confirmed, and marking one of theirs
  unconfirmed would have moved a payable the acceptance tests name.
- **Seller #1134 Seef Steel Fabricators** and **buyer B-204 Seef Retail Group** — a credit
  order half paid, so `partially_paid` has a value. A part-payment collects cash, which
  moves the seller's payable and shrinks their awaiting; on #1088 that would have broken
  acceptance test 10.
- **Three price-match requests** in `submitted`, `accepted` and `declined`. Safe to seed
  because none implies a posting. `credit_issued` is never seeded — that state does imply
  one, and a second record of it would be the same duplication the reconciliation control
  exists to catch.

Buyer names, addresses and VAT numbers are fictional throughout.

## Decisions taken

- **Flat 3% is contractual.** The ledger's card stands. That does not close the file: the
  product's Subscription Settings screen still advertises 10%-then-0%, which was never
  applied, and **two sellers have since been charged more than that screen promised them**
  — Gulf Metal Supplies by 26.200 and Muharraq Cold Store by 0.400, **26.600 in total** if
  both asked. The admin rate-cards screen sizes it; the seller's own rate card shows each
  seller their own figure, so neither side is working from a number the other cannot see.
  Correcting the screen is the open action.
- **#1088's payable is 54.600**, not the 56.400 first stated. See `BRIEF-CORRECTIONS.md`.
- **The BHD 500 simplified-invoice threshold** is measured on the taxable amount, before
  VAT. ORD-1006 is the boundary: 500.000 taxable qualifies, 550.000 payable would not have.

## Known gaps

None outstanding. Every state in the model has a reachable example.
