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

36 assertions, all passing.

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

Plus `?seller=` on the seller surface and `?state=loading|error` on any of them.

## Things to look at

- **Seller wallet** (`seller.html#/wallet`) — the four states. Switch to Muharraq Cold
  Store for `Held`, or Sitra Industrial Tools for `Awaiting buyer`.
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

Everything is derived from the seed in `data.js`. Two things in it are marked
`exampleData` and exist only so a state can be reviewed:

- **Seller #1121 Muharraq Cold Store** — one delivery-unconfirmed order, so `Held` has a
  value. Every seller in the brief has all deliveries confirmed, and marking one of theirs
  unconfirmed would have moved a payable the acceptance tests name.
- **Three price-match requests** in `submitted`, `accepted` and `declined`. Safe to seed
  because none implies a posting. `credit_issued` is never seeded — that state does imply
  one, and a second record of it would be the same duplication the reconciliation control
  exists to catch.

Buyer names, addresses and VAT numbers are fictional throughout.

## Known gaps

- **`partially_paid`** is implemented but has no example. A partial payment against the one
  credit order would collect cash and move #1088's `awaiting`, breaking acceptance test 10.
- **The BHD 500 simplified-invoice threshold** is applied to the total including VAT.
  ORD-1006 is priced at exactly 500.000 and lands at 550.000 with VAT, so it needs the full
  eleven fields. If the rule is meant to apply to the taxable amount instead, that flips.
- **Which rate card is contractual** is unresolved on purpose. The ledger applies flat 3%;
  Subscription Settings advertises 10%-then-0%. The prototype shows both and picks neither.
