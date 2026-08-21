# Special Price Request & RFQ — Feature Flow Draft

**Source:** stakeholder call notes, compiled for walkthrough/sharing.
**Status:** the earlier document. The PRD (`HIGHBASE-Special-Price-RFQ-PRD.md`) is the later
one and resolves several questions this draft leaves open. Where the two disagree, see
`HIGHBASE-Draft-Coverage-Audit.md` — it records which reading the prototype implements and why.

Reproduced verbatim below.

---

## 1. Overview

Buyers can request a special price on a product directly from the product card. There are two possible request paths depending on whether the buyer provides supporting proof of the price they're asking for:

* Case 1 — Special Price Request: buyer submits a specific price ask backed by an attachment/invoice/proof.
* Case 2 — RFQ (Request for Quotation): used when the buyer has no attachment to prove the requested price; buyer instead asks the seller to quote a price for the given quantity/frequency.

Special Price Request is considered stronger than a generic quote because the buyer sends a specific, evidenced price ask. RFQ flips the direction of the negotiation — instead of the buyer asking for a specific price, the seller proactively gives the buyer a quote.

## 2. Entry Point

* Buyer clicks a "Request Special Price" button on the product card.
* Buyer enters the quantity of the product being requested.

## 3. Case 1 — Special Price Request (with proof)

* Buyer adds an attachment / invoice / proof of the price they are requesting.
* Request (quantity + price ask + attachment) is sent to the seller.
* Validation: an invoice/proof is mandatory for this path -(must provide proof). If no attachment is added, the price input field is closed/disabled.
* AI/data-team validation checks whether a valid invoice was actually uploaded (invoice-reading solution being built by Omar).

## 4. Case 2 — RFQ (no attachment)

* If the buyer has no attachment, they can instead send quantity and frequency, and ask the seller for an RFQ on the sent product/quantity.
* Frequency field is a Phase 2 addition (quantity ships first).
* Both paths (Special Price Request and RFQ) should be presented together/combinable under each item, so the buyer can choose either route per item.

## 5. Seller Actions

On receiving a Special Price Request or RFQ, the seller can:

* Accept — one-time acceptance for this order only.
* Accept & apply as template — save the accepted special price to apply going forward (a reusable template); seller can modify an existing template or create a new/specific one.
* Modify — counter with a modified special price.
* Reject — keep the original price. Reject is effectively part of Modify: rejecting resets the price back to the original price.
* MVP behavior: once rejected, the order returns to Pending status, with a cancel option still available for the buyer.

## 6. Buyer Actions (after seller responds)

* If the seller Accepts as-is: buyer takes no action — order proceeds normally.
* If the seller Modifies or Rejects: buyer is notified with the new price (or the reverted original price) and must Accept or Reject the seller's response.
* Buyer should be shown the original price vs. the seller's modified/accepted price side by side for comparison.
* Buyer always has two actions available: Accept (confirms the seller's price, order proceeds) or Reject the modified or original price /Cancel (cancels the order).

## 7. Order Status Flow

* Pending Order: while awaiting the seller's response, the buyer sees no action except a Cancel button.
* Open question (unresolved in the meeting): what exactly triggers/defines the seller "approving" the order?
* Actions created by the buyer as a respond on the modified/rejected of seller , buyer can accept the sent
* Once the seller responds (Accept / Modify / Reject), the buyer gets Accept / Cancel buttons to respond on seller offer, buyer respond is available for modify/reject cases only from seller.
* If order is accepted/approved by seller no action is needed from buyer they will be notified only
* Rejected requests (MVP): order reverts to Pending status with original price, with cancellation still available for buyer

## 8. Notifications & Inbox

* Use Inbox and/or Notifications to alert both buyer and seller whenever the other party takes action.
* Inbox lets users see what has been accepted or rejected.
* Inbox categories: Special Price Request, RFQ, Sent.

## 9. Final Orders

* Final Orders = orders with no RFQ/special price negotiation at all (standard orders), plus RFQ/special-price orders once approved.
* Once an RFQ/special-price order is approved, it moves into Final Orders status.
* Final Orders must show an indicator of the original (old) price vs. the accepted price.
* A full log of all back-and-forth actions between buyer and seller must be retained and viewable.

## 10. Order Page / Admin Visibility

* Order page must indicate that an order went through special price negotiation, including whether an attachment/invoice was submitted.
* Full negotiation history/log must be visible on the order.
* Needed specifically so HB Admins can follow up on past orders where the price was changed.

## 11. Phase 2 / Future Scope

* Frequency field (alongside quantity).
* Special Credit (استمرارية / continuity).
