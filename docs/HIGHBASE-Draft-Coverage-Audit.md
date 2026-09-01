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

Price matching split this table in two. The draft wrote one set of seller actions because
there was one kind of request; there are two now, and the difference is the whole feature.

| Draft action | Match route (`case_1`) | Quote route (`case_2`) |
| --- | --- | --- |
| Accept — one-time, this order only | **Match this price** — the default move, unless a check failed | Accept, where the buyer named a price |
| Accept & apply as template | **Gone** — a price settles one order (PM: order by order) | Gone |
| Modify — counter with a modified price | **Gone** — the guarantee has nothing to counter with | Unchanged: per line, with live margin |
| Reject — keep the original price | Built, and now **carries a named reason** | Same, with the supply-shaped reasons only |
| MVP: rejected → order back to Pending with Cancel | **Reconciled** — see §7 | Same |

Three things enforce the guarantee rather than merely hiding it:

- the transition table itself. `→ countered_by_seller` is the only move in FR-3.3 that asks
  which route a request took, and on `case_1` it is not there — so the reducer rejects a
  seller counter with the same 409 any unlisted transition gets, whatever the UI offered;
- the floor's **auto-decline** (FR-3.4f) no longer fires on the match route. It used to
  refuse a below-floor ask before a person ever saw it, and AC-19.5 forbids the refusal
  from saying why — a silent machine "no" to a price the buyer proved is the sharpest way
  there is to break a guarantee. A below-floor match is queued for a rep instead. EC-22
  survives in the only form left to it: the floor still outranks auto-accept, so the
  machine never sells below floor on its own;
- the floor does not block the seller's **match** either — on the queue row or on the page.
  It is stated instead, in red, with a separate and blunter banner where the match is below
  *cost*, because a floor is a policy and a cost is a loss.

A decline now takes a code from a controlled list and an optional note, mandatory on
`other`, and both are shown to the buyer verbatim. **The list is a placeholder**: the PM
deferred the question of when a verified match may be refused at all, so the vocabulary is
shaped like AC-17.2's and is expected to be replaced once those conditions land.

### The seller's page is a verification screen now

The page was built around a question that no longer exists. "What price am I willing to
give?" was answered by a price field with a margin tracking what the seller typed; under
the guarantee that question is settled before they arrive. What is left is *is this claim
good, and can I live with where it leaves me* — so the page answers that first, and keeps
the submission and the document below it as the working:

1. **A verdict on the document**, before any number: passed every check, flagged something,
   failed, or no document at all.
2. **The claim** — their price, the list price, the gap per unit, and what the order comes
   to against what it would have at list.
3. **Where matching leaves you** — margin after matching, and the floor and the cost each
   with the distance to them and which side. `below by 0.400 BHD` is a decision; "below
   floor" is an adjective.

The margin pill moved out of the status strip and the decision card into that panel, so the
number appears once, against cost and floor, rather than three times in three shapes.

**The ranking follows the verdict.** Matching is the default move — except where an
automatic check has *failed*, because the guarantee is a promise about a price that is
actually verified and that one is not yet. There, "Request more info" takes the primary slot
and matching steps down to a secondary beside it. It is never disabled: a guarantee that
hides its own button is not a guarantee. Where the request has exhausted its two information
requests there is nothing to promote, and matching stays the default.

The template action was the one real defect this audit originally turned up, and it has
since been removed entirely along with the rest of the template branch.

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

## The change sheet — a separate surface for the direction change

`matching.html` (`npm run dev` → `/matching.html`; single-file at
`matching-change-sheet.html`) is the price-matching change beside the prototype rather than
inside it. The prototype answers *what does the product do now*; a finished screen has no
memory of the one it replaced, so it cannot answer *what did the direction change do, and
where do I go and check it* — which is the first question a PM, a reviewer, and whoever
picks the work up next all ask.

Seven sections: the direction dimension by dimension, the three pieces with the file each
is enforced in, the state machine, the auto-rules run live, the seller's real screens, what
is gone and what the PRD still says about it, and the four questions still open with the PM.

Its rule is that only the "before" columns are written prose — that code is gone and there
is nothing left to read it from. Everything else is read live from the same modules the
prototype runs on: the state count and the route-scoped transitions come from `TRANSITIONS`,
the rule verdicts from `evaluateAutoRules`, and §5 mounts the real `SellerRequestPage`
against the same seeded fixtures rather than showing screenshots of it. So the sheet cannot
quietly drift out of agreement with the product it describes.

§4 earns its place on its own: it runs the floor rule on both routes against a price you can
drag. The same 12.600 on HB-2210 is auto-declined on the quote route and queued for a person
on the match route — which is the half of the guarantee no screen can show, because the
behaviour it replaced happened before any screen existed.

## Verified, not asserted

`scripts/audit-draft-cases.mjs` drives the built prototype in a browser and checks each
numbered case is actually reachable and behaves as the draft describes. The domain tests
already prove the rules; this proves a person can get to them.

```
npm run build
npx vite preview --port 4173 &
node scripts/audit-draft-cases.mjs
```

Seventy checks, exit non-zero on any failure. Current run: all pass. What each covers:

| Case | Checked |
| --- | --- |
| §2 | The entry point is on the card, the form asks for quantity, and no request holds more than one item |
| The card note | The card's action is "Matching my price" with an info icon beside it; the icon opens the incentive copy, closes on Escape, and is absent once a request is already open; the form offers a photo *and* a file as two named controls, and restates the 5–10% with who settles it |
| §3 | A priced ask cannot be sent without its document; the buyer sees the picker before the upload and the file after it, and nothing else; extraction and its checks run on submission and land on the seller's page; the request sends and returns a reference |
| §4 | Both routes are offered together as tabs on one item; the RFQ route has no price field and does have frequency |
| §5 | Counter and Decline on a quote row; the detail opens as a page carrying the buyer's submission read back; the quote route keeps Decline · Counter · Accept, and Counter stays dead until a price is typed |
| §5 (matching) | A match row offers Match and Decline and **no Counter**; its page carries three actions and **no price input at all**; the guarantee is stated in words rather than left to be inferred from the missing button; a below-floor match says so in red at the point of commitment and the button stays enabled; matching settles the request once and writes nothing forward |
| The verification panel | It leads the page, names the claim and the position separately, and carries the floor and the cost with the distance to each; on a failed check the ranking flips to lead with "Request more info" while matching stays available; on a clean check matching is the default and the verdict says so |
| Declines | The send button is dead until a reason is chosen; the reasons are a controlled list with a "Choose a reason" placeholder; once named the decline sends, and the buyer's page shows the reason and not just the outcome |
| The guarantee, from the buyer's side | The buyer's special-price list holds no "Counter received" row at all — a counter is now something only the quote route can produce |
| §5 MVP / §7 | A rejected request leaves the order Pending, at the original price, with Cancel and Accept |
| §6 | A modified price gives the buyer Accept and Cancel on the order; an acceptance as-is asks nothing of them; original and agreed sit side by side; the buyer's request detail is a page carrying the same four ranked actions the seller's has, and §6's three prices |
| §8 | The Inbox carries Special Price Request · RFQ · Sent for both roles, with outcomes named |
| §9 | Standard and negotiated orders in one Final Orders list, each naming its outcome — price matched, negotiated or declined; the old-versus-accepted indicator; the full log on the order |
| §10 | The negotiation and invoice flags on the order page, and the HB Admin view |
| §10 (admin) | HB Admin is its own surface: read-only and says so; counts the negotiated orders, the ones whose price moved, the verified prices matched and the ones with no document; groups declines by the reason the supplier gave; filters by outcome; opens the full log in place without losing the table; and shows no margin, cost or floor anywhere |
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

## The product-card note — incentive and invoice capture

A later note from the PM scoped a change to the product card, and it landed as written:

- The card's action is **"Match my price"**, below Add to Cart, with an **info icon**
  beside it carrying the incentive copy verbatim. It opens on click, not hover — on a phone
  there is no hover, and a card is exactly where a hover-only affordance goes unnoticed —
  and closes on Escape or a click outside. The two narrow CTA layouts get the short copy,
  which is what the note's "if space is tight" asks for; the beside-price layout gets no
  icon at all, because the button already shares that row with the price and a third thing
  would crush one of the first two.
- The icon is **not shown once a request is already open** on that SKU. It answers "why
  would I go and find an invoice", which is a question about starting.
- The form takes the proof **two ways, named separately**: *Take a photo* and *Choose a
  file*. One input hinting `capture` is not that — on a phone `capture` sends you straight
  to the camera and some browsers drop the gallery, so a buyer with the invoice already
  saved has no way through; without it, a buyer holding paper has to go and photograph it
  first. Two labelled inputs let each take the route they are on.

- The incentive is disclosed again **at the foot of the form**, as a **disclaimer** — the
  last thing read before Send — and on the confirmation. Both say that **HIGHBASE settles
  it by hand**, which is what the business flow actually does. Nothing computes or issues a
  discount: the note puts that outside the feature, and a prototype implying an automatic
  coupon would be designing something nobody is building.

### What the voice note corrected

A follow-up voice note from the PM (4 minutes, Egyptian Arabic; transcript supplied by the
user, since nothing in this environment can transcribe audio) settled two things the
written note left open, and both were changes to what had already been built:

**The label is "Match my price", not "Matching my price".** The note asks which is right
and lands on the shorter one. It is also the correct answer on its own terms: a button
names an action the person takes, and the gerund named a state — which is why the original
read oddly enough to flag it before the audio arrived.

**The incentive in the form is a disclaimer, not an info icon and not a banner.** It had
been a green banner at the top of the form, and that was the wrong shape twice over: a
celebratory banner reads as a reward already earned, and the top of the form is before the
buyer has done anything to earn it. It now sits at the foot, above Send, under a rule. The
distinction the note draws is worth keeping: on the **card** an icon is right, because the
incentive is an aside a buyer may never want; in the **form** the buyer has committed to
the flow and it is a term of it, and a term you have to go and uncover is not a term you
disclosed.

The note also confirms three things already built: the survey opens with the product's
image and attributes (the drawer's product line item), then the price being asked, then the
invoice; and it should be a **pop-up or a side modal**, with the platform already using
side modals — which is what the drawer is.

The drawer's title is no longer the card's. The card names the route the buyer came for;
the drawer holds both routes and has to still be true after they switch tabs, so it reads
"Ask for a better price".

**Still open on this note.** The button label names one of the two routes the card opens —
the quote route is now reachable only by switching tabs inside a drawer whose entry point
does not mention it. The note's Power BI item asks for internal visibility into
price-matching requests, which the HB Admin surface already provides on screen; no export
was built, since the note routes that through the Data Team. And the voice note asks for
the product-card mockups to be taken into Figma and presented — a hand-off task, waiting on
the mockups the PM said they would send.

**Scope, as the voice note frames it.** It calls this the same idea as the special-price
work "but smaller, less effort, literally an MVP", with manual work by the internal team
accepted as a stopgap until the full module and an agreed proposal exist. The prototype in
this repository is the whole picture; the slice being built this week is the card, the
survey and the invoice on it.

## §9 / §10 after price matching

**The Final Orders outcome split in two.** `accepted` had been covering a guarantee
honoured and a bargain struck, which are not the same fact: two Final Orders at the same
total mean different things depending on which happened, and an auditor asking "was the
guarantee kept?" could not answer it from a row that called both of them accepted. The
outcomes are now **`matched`** (the match route settled at the buyer's proved price),
**`negotiated`** (the quote route settled, or a counter the buyer took — they chose it,
they were not owed it), **`rejected`**, and **`open`**. A request that began on the match
route but ended in a counter the buyer accepted reads `negotiated`, which is the one case
where the route alone gives the wrong answer.

The labels went with it, into one vocabulary: *Price matched · Price negotiated · Price
declined · Price under negotiation*. "Special price rejected" sitting beside "Price
matched" read as two features sharing a column.

**A declined order carries the reason it stands at its original price.** The seller's
decline reason now travels onto the order view and is shown verbatim on the order page,
under the row in Final Orders, and grouped on the admin surface. An order at its original
price raises the question "why", and "rejected" is not an answer to it.

**HB Admin is a fourth surface.** §10 asks for it by name — "needed specifically so HB
Admins can follow up on past orders where the price was changed" — and that is a brief for
an *audit* surface, not a management one. It reads and never writes, and says so at the top
of every section. It carries four counters, a decline-reason breakdown, a filterable table
of every negotiated order with route and outcome and price movement and whether a document
backed it, and the full history log opening in place rather than in a dialog: an admin is
comparing rows, and losing the table to read one of them is the wrong trade on the one
surface whose whole job is the comparison.

What it deliberately does not show is margin, cost or floor. A7 keeps those on the seller's
own surface, and §10 asks for price provenance rather than the seller's commercial
position; an admin who can see a supplier's cost is a different product with a different
set of promises in it. The audit asserts their absence. The one place that judgement could
be revisited is a below-cost match — still open with the PM, below.

## Still open

Where the prototype diverges from the PRD at the user's direction, and what is still
unreconciled in the PRD text itself:

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
5. **Direction change — price matching, order by order.** The PM has moved the feature
   from "request a quote or a special price" to **price matching**, and confirmed that a
   matched price settles one order and no more. The seller's second acceptance — "Accept &
   apply as template" — is gone, and with it the `accepted_as_template` state, its four
   transitions, the saved price list, the template dialog, the `canCreateTemplate`
   permission, the marketplace card's "Agreed price until…" pill, and the rule that
   suppressed the entry point on a SKU already covered. **FR-3.1's twelve states are now
   eleven, and FR-8.3, FR-8.5, FR-8.7 and AC-18.4 describe behaviour the product no longer
   has.**

   The guarantee has now landed on top of that: the seller's counter is off the match route
   in the transition table, the floor neither auto-declines nor blocks a proved ask there,
   and every decline carries a named reason. **This makes four more pieces of the PRD dead
   as written** — FR-3.3's counter rows (unconditional; they are route-scoped now), FR-3.4f
   and AC-19.1 (the auto-decline is quote-route only), AC-15.5's floor block (inert on the
   match route, since there is no counter to block), and US-18 in full. The PRD needs a
   pass; nothing in `docs/HIGHBASE-Special-Price-RFQ-PRD.md` has been edited, so it and the
   code disagree on all of the above until it gets one.

7. **FR-3.4f is now unreachable in Phase 1, and the PM should know.** The floor auto-decline
   only fires on a line that carries an asked price, and after this change only on the quote
   route — but AC-9.2 is explicit that a quote line names no price. So the rule is live,
   tested and correct, and in the shipped P1 shape nothing can trigger it. Either the floor
   stops being an automatic decision at all in P1, or it comes back in some other form; that
   is a product call, not a code one.

8. **Who absorbs a below-cost match.** HB-2210 has a 13.000 floor against an 11.600 cost. A
   verified ask under 11.600 is now matchable, and the screen says so in red before the rep
   confirms — but nothing decides whether the seller eats that, HIGHBASE subsidises it, or
   the guarantee has a floor of its own. Open with the PM.

9. **The name no longer covers the feature.** With the RFQ route staying "as is", this is
   price matching *plus* a quote route, and the two work differently in every respect that
   matters — one is a guarantee, the other a negotiation. Worth a decision on what the
   feature is called before it reaches buyers.
6. **AC-13.1** — the request page no longer carries the history panel. The log is not lost:
   it is on the order (§9, §10), where the draft asks for it and where an HB Admin looks
   for it. What no longer exists is a second copy of it beside the decision.

The draft's §4 ("both paths should be presented together/combinable under each item") reads
alongside 3 rather than against it: the two routes are combinable per item, but a request
currently holds one item.
