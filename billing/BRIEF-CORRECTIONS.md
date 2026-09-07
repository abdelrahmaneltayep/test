# Corrections to the brief

One arithmetic error, found by building the model and confirmed by you. Two edits, both
paste-ready.

---

## The error

The brief's §3 gives Seller #1088 three orders:

| Order | Value | Route | Terms | Commission |
|---|---|---|---|---|
| ORD-3001 | 300.00 | Highbase | credit, 30 days | 9.00 (on collection) |
| ORD-3002 | 120.00 | **Seller** | immediate | 3.60 |
| ORD-3003 | 60.00 | **Highbase** | immediate | 1.80 |

and derives **payable 56.400**, shown as `60.00 − 3.60 netted dues`.

That nets the dues on ORD-3002 but never subtracts ORD-3003's own 1.800. ORD-3003 is
Highbase-collected and on immediate terms, so its commission accrues like any other — the
same rule that takes #1042 from 258.700 to 227.500.

Under the brief's own formula:

    cashBacked = 60.000          ORD-3003 only. ORD-3001 is credit and uncollected;
                                 ORD-3002 was collected by the seller.
    accrued    = −(3.600 + 1.800) = −5.400
                                 ORD-3001's 9.000 does not accrue — the brief's own rule
                                 is that commission accrues on collection, not delivery.

    payable    = MAX(60.000 + MIN(−5.400, 0), 0)
               = 54.600

The formula is the anchor: #1042's `375.00 − 31.20 − 116.30 = 227.50` depends on netting
*all* accrued commission, not just the dues. Matching 56.400 would have meant commission on
Highbase-collected orders sometimes does not accrue, which breaks that identity.

---

## Edit 1 — §3, Seller #1088

Replace:

> **Derived:** cash held 60.00 · **payable 56.400** (60.00 − 3.60 netted dues) · **dues
> 3.600** · **awaiting 300.000 gross / 291.000 net** · online share 60 ÷ 480 = 12.5% →
> standing **watch**

with:

> **Derived:** cash held 60.00 · **payable 54.600** (60.00 − 3.60 dues on ORD-3002 − 1.80
> commission on ORD-3003) · **dues 3.600** · **awaiting 300.000 gross / 291.000 net** ·
> online share 60 ÷ 480 = 12.5% → standing **watch**

## Edit 2 — §8, test 10

Replace:

> 10. Seller #1088 awaiting is `300.000` gross / `291.000` net, and payable is `56.400`.

with:

> 10. Seller #1088 awaiting is `300.000` gross / `291.000` net, and payable is `54.600`.

---

## Nothing else moves

Every other figure in the brief holds. Verified across the whole seed:

| | Stated | Computed |
|---|---|---|
| #1042 payable | 227.500 | 227.500 |
| #1042 dues | 19.950 | 19.950 |
| #1042 seller-collected share | 63.9% | 63.9% |
| #1042 stated balance, as filed | 518.50 | 518.500 |
| #1042 overstatement | 291.00 (28.0%, 9.33×) | 291.000 (28.0%, 9.33×) |
| #1067 payable | 81.000 | 81.000 |
| #1067 unfunded | 0.300 | 0.300 |
| ORD-2001 Highbase net | −6.300 | −6.300 |
| #1088 awaiting | 300.000 / 291.000 | 300.000 / 291.000 |
| #1103 payable / dues | 0.000 / 159.000 | 0.000 / 159.000 |
| Standings | good / watch / watch / suspended | good / watch / watch / suspended |

Run `node -e "require('./billing/selftest.js').run()"` — 36 assertions, all passing.

---

## Two readings the brief left open, resolved by its own numbers

Not errors — the brief did not say which was meant, and only one reading satisfies every
figure it states.

**`onlineShare` is the gross value of Highbase-route *immediate* orders ÷ net GMV.**

| Seller | This reading | Collected cash | All Highbase-route |
|---|---|---|---|
| #1042 | **36.1%** ✓ | 36.1% ✓ | 36.1% ✓ |
| #1067 | **31.0%** ✓ | 27.9% ✗ trips the floor | 31.0% ✓ |
| #1088 | **12.5%** ✓ | 12.5% ✓ | 75.0% ✗ |
| #1103 | **0.0%** ✓ | 0.0% ✓ | 0.0% ✓ |

Only the first column gives all four stated shares *and* leaves #1067 flagged on discount
spend alone, as §3 narrates. A Highbase-route order on credit terms has not reached
Highbase, so it does not count toward the share.

**The reconciliation control excludes uncollected credit orders from both sides.**
Otherwise #1088 fails it every cycle: 3% × 480 = 14.400 expected against 5.400 accrued.
That is a timing fact, not a discrepancy, and a control that cannot tell them apart cries
wolf until nobody reads it.
