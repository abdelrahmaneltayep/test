# HIGHBASE Billing — statements prototype

Built from **BRD: Billing (Draft)**, 7 September 2026, Andaleeb A. Khogli.

Open `index.html` from the filesystem. No build step, no server, no dependencies.

```
index.html      role picker, and the BRD's worked example computed live
seller.html     running-balance statement, dues, plan
admin.html      seller statements, buyer statements, settlement cycle, open questions
buyer.html      purchase orders, non-cumulative, no commission
data.js         the ledger and every derivation — the point of the prototype
selftest.js     34 assertions, run on load and headless
strings.js      every display string
ui.js           shared components
styles.css      design system
```

Run the model tests without a browser:

```
node -e "require('./statements/selftest.js').run()"
```

## What this module is

A calculation and reporting layer. **It moves no money.** The BRD is explicit (§4, §11):
there is no payment gateway in Phase 1, and Finance executes every transfer by hand from
these numbers. So a settlement cycle here is a *report* — "pay this, collect that" — and
no screen has a button that settles anything. The strip under every header says so.

## What it deliberately does not do

**Credit orders are not modelled.** The BRD puts them out of scope and flags them as
unresolved (§4, §12). Building them would have put a number in front of a stakeholder
that the business has not decided on.

## The three levels (§7.2)

1. **List of seller statements** — HB Admin only.
2. **Seller profile statement** — cumulative, with a balance carried forward order over
   order. Seller sees their own; Admin sees all.
3. **Buyer profile statement** — *not* cumulative, and carrying no commission. Buyer sees
   their own; Admin sees all.

That structural difference is the BRD's, and it is enforced rather than styled: buyer rows
are built by their own function rather than filtered from the seller ledger, so a
commission figure cannot reach a buyer screen by being left in an object. The shared order
drawer takes a role and never builds the commission stages for a buyer.

All four reporting periods (§7.1) — yearly, monthly, weekly, per-order — are on every
statement level, and each exports to CSV or to PDF through the browser's print dialogue.

## The worked example (§7.8)

The BRD commits to exactly one worked example, and it reproduces exactly. Seller
**Bahrain Fresh Foods**:

| | |
|---|---|
| Order A · COD 200.000 | courier pays the seller; **10.000** booked as HB receivable |
| Order B · HB Payment 100.000 | commission **5.000** + prior debt **10.000** = 15.000 deducted |
| Released | **85.000**, and the debt is cleared |

## Where this build had to take a position

Eight places. Every one is listed in **Admin → Open questions**, live in the prototype, and
marked with a `?` next to the number on the screen where it matters.

Two are contradictions in the document itself, and they are worth settling before build:

**1 · The worked example does not reconcile with the 3% rule.** §7.5 sets the default
commission at 3% of the pre-VAT base. §7.8's example charges 10 on 200 and 5 on 100 —
that is 5%, on the order total. At 3% on a VAT-inclusive 100 the figure would be 2.727,
not 5.

Both clauses can hold at once, in one way only: the seller is on a negotiated 5% agreement
— which §7.5 explicitly allows — and the goods are zero-rated, so the pre-VAT base *is*
the order total. That is how Bahrain Fresh Foods is set up here. It is a reading, not a
fact.

**2 · "HB Receivable (incl. HB coupons)".** The column name (§8) says HB coupons are
*included in* what HB collects from the seller. But §7.6 says HB absorbs a coupon it
funded. Read here as netting: a coupon HB funded reduces what HB collects. The name reads
the other way and needs settling.

The remaining six:

| | BRD | Position taken |
|---|---|---|
| Credit orders | §4, §12 | Not modelled — out of scope |
| Net Payables, HB Transaction, Balance, HB Payment Due, Seller Due | §8, §12 | Implemented and marked as proposals. Net Payables is one signed number: positive means HB owes the seller |
| Settlement cadence | §7.9, §12 | Per seller, not platform-wide. Two sellers weekly, one on five days |
| HB Deduction | §8, §12 | Its own column. Folded into fixed fees it stops being explicable to the seller who was charged it |
| Seller-facing labels | §12 | "Your Balance" and "Your Dues" name amounts; "My financial status" names a screen, not a figure |
| Notify at the COD order? | §12 | Built both ways, on a switch — Seller → My dues |

## Two things the seed data surfaces that the BRD does not discuss

**A payout that floors at zero.** Sitra Tools sells almost entirely on COD. Its one prepaid
order is too small to absorb the debt already built: netting clears 16.050, pays out
0.000, and carries 0.890 — then the next COD order takes it back to 9.890. Smart offsetting
has to survive this, which is why a payout is floored rather than allowed to run negative.

**A fixed fee with nowhere to come from.** A subscription fee is netted out of a payout.
When the payout is zero, the fee cannot be recovered — Sitra's 15.000 has no source this
cycle. The BRD does not say what happens next. Admin → Settlement cycle names it.

## Seed data

Three sellers, three buyers, thirteen orders, chosen so each rule in §7 has at least one
case: VAT-exclusive and VAT-inclusive pricing on the same money, an HB-funded coupon and a
seller-funded discount, a rejected line and a cancelled line, a branch on its own plan, a
rate that steps at a volume threshold, and a shipping charge and a penalty.

Buyer and seller company names are fictional.

## Verification

- 34 model assertions in `selftest.js`, run on page load and headless in Node.
- A browser driver walks all thirteen screens, checks every `[data-money]` value renders
  three decimals, opens the drawer from both a seller and a buyer row, and asserts no
  commission wording reaches any buyer screen.
