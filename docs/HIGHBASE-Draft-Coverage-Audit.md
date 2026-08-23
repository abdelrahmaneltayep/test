# Feature Flow Draft — coverage audit

What the clickable prototype does with each section of
`HIGHBASE-Special-Price-RFQ-Feature-Flow-Draft.md`, and where the draft and the PRD
(`HIGHBASE-Special-Price-RFQ-PRD.md`) disagree.

Three verdicts are used:

* **Already built** — the behaviour was in the prototype before this pass.
* **Built now** — added in this pass, in response to the draft.
* **Reconciled** — the draft and the PRD ask for different things; what was built, and why.

---

## §1 Overview — two routes

**Already built.** Case 1 and Case 2 are the two routes on every request line, chosen per
line. Case 1 carries a priced ask plus proof; Case 2 carries quantity (and, under Phase 2,
frequency) with no price, and its outcome column reads "—" rather than an inferred number.
The seller's queue and the buyer's list both distinguish them.

## §2 Entry point — button on the card, then quantity

**Already built.** The entry point is on the product card and on the product detail page,
beside Add to Cart. Quantity is the first thing the form asks for and drives the
tier-comparison line. An ineligible SKU renders no entry point at all rather than a
disabled one.

## §3 Case 1 — proof mandatory

**Already built, with one deliberate difference.** Proof is mandatory: a Case 1 request
cannot be sent without an attachment, and the send button says which field is missing.
Extraction is simulated — supplier, SKU, unit price, document date and currency are read
back, shown beside what the buyer typed, and never overwrite it. The automatic checks
(freshness, identity, duplicate) run on the result, exactly the slot the invoice-reading
work fills.

The difference: the draft says "if no attachment is added, the price input field is
closed/disabled". The prototype leaves the price field open and blocks the *send* instead.
That ordering was set deliberately in an earlier round — the form asks for the target price
first, then the supplier, then the attachment — and disabling a field that sits above the
one that unlocks it reads as a bug. The constraint the draft is protecting (no priced ask
without evidence) is enforced, just at submission rather than at focus.

## §4 Case 2 — RFQ, and both routes offered together

**Already built.** The two routes are tabs at the top of one form, so the buyer picks either
per item, and "I have a price to match" is preselected. Frequency is present and gated
behind the Phase 2 flag, so the P1-only setting hides it — which is what "quantity ships
first" means in practice.

## §5 Seller actions

| Draft action | Status |
| --- | --- |
| Accept — one-time, this order only | **Built now** as its own button, "Accept (this order only)" |
| Accept & apply as template | **Built now** as a distinct seller decision |
| Modify — counter with a modified price | Already built, per line, with live margin |
| Reject — keep the original price | Already built; a declined line resolves at list price |
| MVP: rejected → order back to Pending with Cancel | **Reconciled** — see §7 |

The template action was the one real defect this audit turned up. The seller's template
dialog existed, but it dispatched the *buyer's* acceptance, which the transition guard
rejects from a seller-side state — so the request stayed in the queue while a price-list
entry was written anyway. Accept and Accept-&-apply-as-template are now two seller
transitions of their own, and the price list is only written when the transition succeeds.
Neither is offered on a request whose lines have no asked price, because an RFQ line has
nothing to accept as-is.

## §6 Buyer actions after the seller responds

**Already built,** apart from the order-level buttons.

* Seller accepts as-is → nothing is asked of the buyer; the order proceeds. **Built now**
  on the order itself.
* Seller modifies or rejects → the buyer is notified and must answer. **Built now** as
  Accept / Cancel on the order.
* Original price beside the seller's price → already built: the comparison table has
  original, asked and offered as three columns, per line and as totals, with the outcome
  named in words.

## §7 Order status flow — and the circularity the PRD already resolved

**Reconciled, then built.**

The draft describes Pending, Accept/Cancel and revert-to-Pending-on-reject as states of the
*request*. The PRD deliberately does not: §6.6 Decision 2 separates the negotiation object
from the order object, and FR-3.1's twelve states make terminal terminal. Implementing the
draft literally would mean a `declined` request that is somehow awaiting a decision — the
exact loop the PRD closed, and the same place the draft itself records an open question
("what exactly triggers/defines the seller approving the order?").

Both are satisfiable at once, and that is what was built. The negotiation is unchanged. A
second aggregate — the order — observes it and stores only two facts of its own: whether the
buyer confirmed, and whether the buyer cancelled. Everything the draft calls an order status
is projected from the negotiation:

| Negotiation | Order status | Buyer's buttons | Price shown |
| --- | --- | --- | --- |
| submitted / viewed / countered by buyer | Pending, awaiting seller | Cancel | original |
| info requested | Pending | Cancel | original |
| countered by seller (Modify) | Pending, awaiting buyer | Accept · Cancel | the seller's price |
| accepted / accepted as template | **Final** | none | the accepted price |
| declined (Reject) | **Pending**, awaiting buyer | Accept · Cancel | **original** |
| expired | Pending, awaiting buyer | Accept · Cancel | original |
| withdrawn | Cancelled | none | original |

So the draft's MVP sentence holds exactly — "once rejected, the order returns to Pending
status, with a cancel option still available" — and §7's "buyer can accept the sent" holds
with it, without any request ever leaving a terminal state. The buyer's own decision wins
over everything after it: a cancelled order stays cancelled, and a confirmed order keeps the
price it was confirmed at.

The draft's open question is answered by construction: the seller does not "approve the
order". The seller settles the *price*; the order is placed when the price is settled with
no buyer decision outstanding, which is either the seller accepting as asked or the buyer
accepting what came back.

## §8 Notifications & Inbox

**Built now.** An Inbox for both roles, with the draft's three categories — Special Price
Request, RFQ, Sent. Nothing is stored for it: the inbox is a projection of the append-only
history log, which already carries the actor and the timestamp. That is what keeps Sent
honest — it is not a separate outbox, it is the same events read from the other side, so the
three tabs partition the log instead of overlapping it.

Each row names its outcome in words (Accepted / Rejected / Price changed / Information /
Sent / Closed), which is §8's "lets users see what has been accepted or rejected". The
sidebar badge and the bell count the same unread number: the latest move by the other party
on a thread that is now waiting on you.

The seller's queue already had Special price / RFQ / Sent tabs, from FR-5.1 — those are a
work queue, filtered by what needs deciding. The Inbox is the notification history. Both
exist, and they are not the same surface.

## §9 Final Orders

**Built now.** One list holding both kinds the draft names — standard orders that never went
through a negotiation, and negotiated orders once their price is settled — split into
Pending, Final Orders and Cancelled. Every row carries the old price, the agreed price and
the difference in money and percent, stated in words when there is none ("No change"), which
is the honest reading of a rejected request the buyer confirmed anyway. The full
back-and-forth is on the order.

## §10 Order page / admin visibility

**Built now.** The order page marks whether the order went through a negotiation and whether
an invoice or quote was submitted, links to the negotiation reference, and carries the
complete history log. An HB Admin view names the document on record with its hash, and
states that the log is append-only and cannot be edited or deleted by any role — including
HIGHBASE administrators. That last part is FR-12.2, and it is the thing that makes the log
worth following up on.

## §11 Phase 2 / future scope

* **Frequency** — already built, behind the Phase 2 flag.
* **Special Credit (استمرارية)** — not built. The draft carries one line and no rules, and
  the PRD does not pick it up. It needs its own definition before it can be prototyped.

---

## Verified, not asserted

`scripts/audit-draft-cases.mjs` drives the built prototype in a browser and checks each
numbered case is actually reachable and behaves as the draft describes. The domain tests
already prove the rules; this proves a person can get to them.

```
npm run build
npx vite preview --port 4173 &
node scripts/audit-draft-cases.mjs
```

Thirty-nine checks, exit non-zero on any failure. Current run: all pass. What each covers:

| Case | Checked |
| --- | --- |
| §2 | The entry point is on the card, the form asks for quantity, and no request holds more than one item |
| §3 | A priced ask cannot be sent without its document; extraction runs and the three checks report; the request sends and returns a reference |
| §4 | Both routes are offered together as tabs on one item; the RFQ route has no price field and does have frequency |
| §5 | Accept, Counter and Decline on the queue row; the detail opens as a page carrying the buyer's submission read back; Accept & apply as template on it; the template acceptance lands the request in Template active |
| §5 MVP / §7 | A rejected request leaves the order Pending, at the original price, with Cancel and Accept |
| §6 | A modified price gives the buyer Accept and Cancel on the order; an acceptance as-is asks nothing of them; original and agreed sit side by side; the buyer's request detail is a page carrying the same four ranked actions the seller's has, and §6's three prices |
| §8 | The Inbox carries Special Price Request · RFQ · Sent for both roles, with outcomes named |
| §9 | Standard and negotiated orders in one Final Orders list; the old-versus-accepted indicator; the full log on the order |
| §10 | The negotiation and invoice flags on the order page, and the HB Admin view |
| §11 | Special credit offered, captured and shown to the seller; both readings of the phase cut are walkable |

## §11 in full

**Frequency, and the phase cut.** The two documents disagree about where Phase 1 ends.
Draft §4 makes frequency the Phase 2 addition — "quantity ships first" — with both routes
live from the start. The PRD cuts it the other way: Case 1, the evidenced ask, is **[P2]**
(AC-3.3, with the rationale at PRD §2 — Phase 1 first because it is the half with working
implementations to copy, and it builds the container the proof flow needs), while frequency
is a Case 2 field captured from Phase 1 (AC-5.2, Q-8).

Rather than assert one and leave the other unwalkable, the demo bar now offers three
release lines and the prototype honours each:

| Setting | Routes offered | Frequency | Extraction · special credit |
| --- | --- | --- | --- |
| **P1 + P2** | both | yes | yes |
| **P1 · PRD** | RFQ only (AC-3.3) | yes (AC-5.2, Q-8) | no |
| **P1 · draft** | both (§1, §4) | no — quantity ships first | no |

Both readings are now demonstrable side by side, which is what the walkthrough needs; the
choice between them stays with the PM, and neither document is silently overruled.

**Special Credit (استمرارية).** Built, as a Phase 2 field on the request form — offered on
both routes, because continuity belongs to the arrangement rather than to either route. The
draft gives it one line and no rules and the PRD does not pick it up, so it is captured and
displayed and nothing else: it changes no price, fires no rule, and never enters the margin
maths. That is exactly the treatment frequency gets under Q-8, for the same reason. The
seller sees it on the request line, beside the frequency the buyer asked for. Anything more
— what continuity actually entitles a buyer to — needs a definition before it can be built.

---

## Still open

Three places where the prototype diverges from the PRD at the user's direction, unchanged by
this pass and still unreconciled in the PRD text itself:

1. **US-7** — the review step was collapsed into the single form.
2. **AC-3.2** — the route is preselected, so there is no unchosen state.
3. **US-6 / §6.6 Decision 1 / M-L8** — a request holds one item, which is what the draft's
   §2 describes: the buyer asks from a product's card, so a product is a request. The object
   model still holds a line collection for FR-1.9.
4. **US-10 / AC-10.4 / FR-3.4c** — the buyer cannot counter. Draft §6 gives them two moves
   and only two — "Accept (confirms the seller's price, order proceeds) or Reject the
   modified or original price / Cancel" — so the counter is a seller move now. The
   transition and its round cap stay in the state machine, because the PRD's multi-round
   negotiation is still what the domain describes, but nothing on a buyer surface reaches
   them. Rounds therefore only ever increment from the seller's side.
5. **AC-13.1** — the request page no longer carries the history panel. The log is not lost:
   it is on the order (§9, §10), where the draft asks for it and where an HB Admin looks
   for it. What no longer exists is a second copy of it beside the decision.

The draft's §4 ("both paths should be presented together/combinable under each item") reads
alongside 3 rather than against it: the two routes are combinable per item, but a request
currently holds one item.
