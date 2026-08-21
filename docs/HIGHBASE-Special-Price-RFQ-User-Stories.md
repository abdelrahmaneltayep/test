# User Stories — Special Price Request & RFQ

**Source:** *Special Price Request & RFQ Feature Flow Draft* (compiled from stakeholder call notes)
**Generated for:** HIGHBASE product team · grooming and estimation
**Author:** Abdelrahman Eltayep · **Date:** August 2026

---

## How to read this

These stories are generated **from the draft as written**. Where the draft says something, the story says the same thing in the draft's own vocabulary — *Special Price Request, RFQ, Modify, Reject, Pending, Final Orders, Inbox, template*. Nothing has been quietly redesigned.

Where the draft is **silent, ambiguous, or self-contradicting**, the story is still written, and the problem is flagged inline as a **⚠ Spec gap** with the exact question that has to be answered before that story can be estimated. Twenty are flagged in total; the four that block estimation entirely are collected in **Blocking questions** at the end.

| Convention | Meaning |
|---|---|
| `S-nnn` | Story ID. First digit is the epic. |
| **MVP** / **Phase 2** | As designated in the draft. The draft names only two things as Phase 2: the frequency field and Special Credit. |
| **§n** | Traces to that section of the draft. |
| ⚠ **Spec gap** | The draft does not answer this. Grooming input, not a design opinion. |
| Given / When / Then | Acceptance criteria, written to be lifted into test cases. |

**Sizing note.** 28 stories across 8 epics. The draft describes roughly a two-to-three sprint MVP *if* the three blocking questions are closed first; the buyer-response and order-status epic (E5) carries the most risk, because it is where the draft contradicts itself.

---

## Epic map

| Epic | Draft sections | Stories | Theme |
|---|---|---|---|
| **E1** | §1, §2 | S-101 … S-103 | Entry point and request creation |
| **E2** | §3 | S-201 … S-204 | Case 1 — Special Price Request with proof |
| **E3** | §4 | S-301 … S-303 | Case 2 — RFQ without proof |
| **E4** | §5 | S-401 … S-405 | Seller response actions |
| **E5** | §6, §7 | S-501 … S-504 | Buyer response and order status |
| **E6** | §8 | S-601 … S-603 | Notifications and Inbox |
| **E7** | §9, §10 | S-701 … S-704 | Final Orders, negotiation log, admin visibility |
| **E8** | §11 | S-801 … S-802 | Phase 2 scope |

---

# E1 — Entry point and request creation
*Draft §1, §2*

---

### S-101 — Request a special price from the product card · **MVP** · §2

> **As a** buyer,
> **I want** to request a special price directly from the product card,
> **so that** I can start a price negotiation at the moment I see a price I don't want to pay, without leaving the product.

**Acceptance criteria**

- **AC-1** — Given I am viewing a product card, when the card renders, then a **Request Special Price** button is visible on the card.
- **AC-2** — Given I click **Request Special Price**, when the request flow opens, then the product I clicked from is carried into the request and shown to me.
- **AC-3** — Given the request flow is open, when I abandon it without submitting, then no request is created and no notification is sent to the seller.
- **AC-4** — Given I submit a request, when submission succeeds, then I receive a confirmation that the request has been sent to the seller.

⚠ **Spec gap 1** — The draft does not say which products carry the button. Is it every product, only products from linked sellers, only products above a quantity or value threshold, or seller-configurable? This changes both the catalogue work and the expected request volume.

---

### S-102 — State the quantity being requested · **MVP** · §2

> **As a** buyer,
> **I want** to enter the quantity I am requesting a price for,
> **so that** the seller is pricing the volume I actually intend to buy.

**Acceptance criteria**

- **AC-1** — Given the request flow is open, when the first step renders, then a quantity input is present and required.
- **AC-2** — Given I have not entered a quantity, when I try to continue, then I am blocked and told that quantity is required.
- **AC-3** — Given I enter a quantity, when I continue, then the quantity is carried through to both the Case 1 and the Case 2 path unchanged.
- **AC-4** — Given the request is submitted, when the seller views it, then the quantity is displayed to the seller.

⚠ **Spec gap 2** — The draft does not specify the unit (pieces, cases, cartons), whether there is a minimum, or what happens when the requested quantity exceeds available stock.

---

### S-103 — Choose between Special Price Request and RFQ per item · **MVP** · §1, §4

> **As a** buyer,
> **I want** both request paths offered together on the item I am requesting,
> **so that** I can pick the route that matches what I actually have — a price to prove, or a price to ask for.

**Acceptance criteria**

- **AC-1** — Given I am creating a request for an item, when the request options render, then **both** Special Price Request and RFQ are presented together for that item, per the draft's *"presented together/combinable under each item."*
- **AC-2** — Given I select one route for an item, when I continue, then only that route's fields are collected for that item.
- **AC-3** — Given I select the Special Price Request route, when the form renders, then the price input behaves as described in S-201.
- **AC-4** — Given I select the RFQ route, when the form renders, then no attachment is requested.

⚠ **Spec gap 3 — blocking.** *"Combinable under each item"* is the single most consequential ambiguity in the draft. Two readings are possible and they produce different products:

| Reading | Consequence |
|---|---|
| **A — per item.** Each item generates its own request, its own seller decision, its own status. | A buyer wanting better prices on 5 SKUs creates 5 negotiations. There is no "what is this order worth" answer for either side. |
| **B — one request, many lines.** One request contains N items, each line carrying its own route. | One seller decision, one status, one log. Requires a request container object that the draft never mentions. |

Every story in E4, E5 and E7 is written differently depending on the answer. **This must be decided before E4 is estimated.** The benchmark analysis recommends Reading B; the draft as written reads closer to A.

---

# E2 — Case 1: Special Price Request with proof
*Draft §3*

---

### S-201 — Submit a price ask backed by proof · **MVP** · §3

> **As a** buyer,
> **I want** to state the specific price I want and attach an invoice or proof for it,
> **so that** my ask carries evidence and is treated as stronger than a generic quote request.

**Acceptance criteria**

- **AC-1** — Given I chose the Special Price Request route, when the form renders, then it contains a price input and an attachment control.
- **AC-2** — Given no attachment has been added, when the form renders, then the price input is **closed/disabled** — as specified in the draft.
- **AC-3** — Given I add a valid attachment, when the upload completes, then the price input becomes enabled and editable.
- **AC-4** — Given I remove the attachment after entering a price, when the attachment is removed, then the price input returns to its disabled state.
- **AC-5** — Given quantity, price ask and attachment are all present, when I submit, then all three are transmitted to the seller as one request.
- **AC-6** — Given I attempt to submit without an attachment, when I submit, then submission is blocked, because proof is mandatory on this path.

⚠ **Spec gap 4** — The draft mandates a disabled price input as the mechanism for signalling "proof required," but does not say whether the buyer is told *why* it is disabled. A silently disabled field with no stated reason is the pattern the earlier HIGHBASE usability audit flagged across the admin. Minimum fix inside the draft's own design: a visible helper message on the disabled input. Recommended alternative: an explicit route choice (S-103, Reading B).

---

### S-202 — Have the uploaded proof validated automatically · **MVP** · §3

> **As a** buyer,
> **I want** the system to check that what I uploaded is actually a valid invoice,
> **so that** I find out my proof is unusable before the seller does, not after.

**Acceptance criteria**

- **AC-1** — Given I upload a file, when the upload completes, then the invoice-reading validation is invoked (the solution being built by Omar's team).
- **AC-2** — Given validation determines a valid invoice was uploaded, when the result returns, then the request may proceed to submission.
- **AC-3** — Given validation determines no valid invoice was uploaded, when the result returns, then I am informed and told what is wrong.
- **AC-4** — Given validation is unavailable or times out, when I attempt to submit, then the submission path is defined and deterministic — see Spec gap 5.
- **AC-5** — Given a request was submitted, when the seller opens it, then the validation outcome is visible to the seller alongside the file.

⚠ **Spec gap 5 — blocking.** The draft says validation "checks whether a valid invoice was actually uploaded" but never says what happens when it fails. Four questions, all of which change the flow:
1. Does a failed validation **block submission**, or **flag** the request and let it through?
2. Is the outcome shown to the **buyer**, the **seller**, or both?
3. What happens when the validation service is **down** — block, or pass through unvalidated?
4. Is validation a **hard gate** or **advisory input to the seller's judgement**?

This is an integration dependency on another team, so it also needs an interface contract and a delivery date before E2 can be committed.

---

### S-203 — Attach the proof file to the request record · **MVP** · §3, §10

> **As a** seller,
> **I want** the buyer's attachment stored with the request and openable from it,
> **so that** I can look at the evidence before deciding, and it is still there when someone reviews the order later.

**Acceptance criteria**

- **AC-1** — Given a request with an attachment, when I open the request, then I can view or download the attached file.
- **AC-2** — Given a request with an attachment, when the request becomes an order, then the attachment remains retrievable from the order record.
- **AC-3** — Given a request with an attachment, when an HB Admin views the order, then the attachment is accessible to them (see S-703).
- **AC-4** — Given a file type or size outside what is supported, when the buyer uploads it, then the upload is rejected with the supported formats and limit stated.

⚠ **Spec gap 6** — The draft does not state accepted file types, size limits, how many files per request, or the retention period.

---

### S-204 — See that a request carries proof · **MVP** · §3, §10

> **As a** seller,
> **I want** to see immediately that a request is a Special Price Request rather than an RFQ,
> **so that** I know whether there is evidence to weigh before I open it.

**Acceptance criteria**

- **AC-1** — Given a list of incoming requests, when it renders, then each entry indicates whether it is a Special Price Request (with proof) or an RFQ (no proof).
- **AC-2** — Given a Special Price Request, when I open it, then the buyer's asked price, the quantity and the attachment are all visible on one screen.
- **AC-3** — Given an RFQ, when I open it, then no attachment section is rendered — not an empty one.

---

# E3 — Case 2: RFQ without proof
*Draft §4*

---

### S-301 — Ask the seller to quote when I have no proof · **MVP** · §4

> **As a** buyer,
> **I want** to send the seller my quantity and ask them to quote a price,
> **so that** I can still open a negotiation when I have no invoice to attach.

**Acceptance criteria**

- **AC-1** — Given I have no attachment, when I am in the request flow, then the RFQ route is available to me.
- **AC-2** — Given I choose the RFQ route, when the form renders, then quantity is collected and no price ask is requested from me.
- **AC-3** — Given I submit an RFQ, when submission succeeds, then the seller receives it identified as an RFQ.
- **AC-4** — Given I submit an RFQ, when the seller views it, then they are being asked to state a price — the direction of the negotiation is reversed relative to Case 1, per §1.

---

### S-302 — Receive a seller-initiated quote · **MVP** · §1, §4

> **As a** buyer,
> **I want** the seller to come back to me with their quoted price,
> **so that** I have a number to accept or reject even though I never named one.

**Acceptance criteria**

- **AC-1** — Given a seller quotes against my RFQ, when the response arrives, then I am notified (see S-601).
- **AC-2** — Given a seller has quoted, when I open the request, then the quoted price and the original price are both shown.
- **AC-3** — Given a seller has quoted, when I view my available actions, then Accept and Reject/Cancel are available, consistent with §6.

⚠ **Spec gap 7** — §6 describes the buyer's comparison as *"the original price vs. the seller's modified/accepted price."* On the RFQ path the buyer never stated a price, so only two numbers exist. On the Special Price Request path there are **three** — original, what the buyer asked, and what the seller offered. The draft's comparison screen needs to handle both shapes.

---

### S-303 — Tell the seller how often I will buy · **Phase 2** · §4, §11

> **As a** buyer,
> **I want** to state how frequently I expect to reorder,
> **so that** the seller can price for a recurring commitment rather than a one-off.

**Acceptance criteria**

- **AC-1** — Given the RFQ form, when frequency is enabled, then a frequency input is present alongside quantity.
- **AC-2** — Given I submit an RFQ with a frequency, when the seller views it, then the frequency is displayed.
- **AC-3** — Given frequency is not yet released, when the RFQ form renders, then quantity ships alone and no disabled or placeholder frequency field is shown.

**Note** — The draft is explicit that *"quantity ships first"* and frequency is a Phase 2 addition. Sequenced accordingly; do not build a hidden or disabled control in the MVP.

⚠ **Spec gap 8** — Frequency's input type is unspecified: free text, or a controlled list (one-off / weekly / monthly)? A controlled list is required if frequency is ever to drive a template or a recurring order.

---

# E4 — Seller response actions
*Draft §5*

---

### S-401 — Accept the buyer's price for this order only · **MVP** · §5

> **As a** seller,
> **I want** to accept the buyer's requested price as a one-time acceptance,
> **so that** I can close this deal without committing to that price in future.

**Acceptance criteria**

- **AC-1** — Given an incoming Special Price Request or RFQ, when I open it, then **Accept** is available as an action.
- **AC-2** — Given I accept, when the action completes, then the price applies to this order only and no template is created.
- **AC-3** — Given I accept, when the action completes, then the buyer is notified and **no buyer action is required** — the order proceeds normally, per §6.
- **AC-4** — Given I accept, when the order is created, then it moves into Final Orders, per §9.
- **AC-5** — Given I accept, when the action completes, then the acceptance is written to the negotiation log (see S-702).

---

### S-402 — Accept and save the price as a reusable template · **MVP** · §5

> **As a** seller,
> **I want** to accept a price and save it as a template that applies going forward,
> **so that** I am not renegotiating the same product with the same buyer every time.

**Acceptance criteria**

- **AC-1** — Given I am responding to a request, when I view my actions, then **Accept & apply as template** is available and distinct from plain Accept.
- **AC-2** — Given I choose it, when I confirm, then the accepted special price is saved so it applies to future orders.
- **AC-3** — Given a template already exists for this combination, when I choose the action, then I can **modify the existing template**, per §5.
- **AC-4** — Given no template exists, when I choose the action, then I can **create a new/specific template**, per §5.
- **AC-5** — Given a template is active, when the buyer next views that product, then the template price is what applies.
- **AC-6** — Given a template is created, when the negotiation log is viewed, then the template creation and its parameters are recorded.

⚠ **Spec gap 9 — blocking.** *"Apply going forward"* is undefined, and a template is a pricing object with a lifecycle the draft never describes:
1. **Scope** — does the template apply to this **buyer only**, a buyer **group**, or **all buyers**?
2. **Expiry** — does it ever end? On a date, after N orders, never?
3. **Quantity conditions** — does the price hold at any quantity, or only at or above the quantity negotiated?
4. **Conflict** — what happens when a template already exists and a new one is created for the same product and buyer? *(§5 says the seller "can modify an existing template or create a new/specific one" — it does not say which wins.)*
5. **Ownership** — who can edit or revoke a template afterwards?

A price that applies indefinitely, to an undefined audience, with no expiry, is a commercial risk, not just a spec gap. **This cannot be estimated as written.**

---

### S-403 — Counter with a modified price · **MVP** · §5

> **As a** seller,
> **I want** to respond with a modified special price rather than a flat yes or no,
> **so that** I can meet the buyer partway instead of losing the order.

**Acceptance criteria**

- **AC-1** — Given an incoming request, when I open it, then **Modify** is available.
- **AC-2** — Given I choose Modify, when the input renders, then I can enter a different price from the one requested.
- **AC-3** — Given I submit a modified price, when it transmits, then the buyer is notified with the new price and must Accept or Reject it, per §6.
- **AC-4** — Given I have modified, when the buyer views the request, then the original price and my modified price are shown side by side, per §6.
- **AC-5** — Given I modify, when the action completes, then the modification is written to the negotiation log with both the previous and the new value.

⚠ **Spec gap 10** — The draft does not cap the number of Modify rounds, nor does it say whether the buyer can counter back with their own number, or only Accept/Reject what the seller sent. §6 implies the latter — the buyer gets Accept or Reject only — which means the negotiation is at most two moves deep. Confirm this is intended.

---

### S-404 — Reject and keep the original price · **MVP** · §5

> **As a** seller,
> **I want** to reject the request and keep my original price,
> **so that** I can decline a price I can't offer without cancelling the buyer's order.

**Acceptance criteria**

- **AC-1** — Given an incoming request, when I open it, then **Reject** is available.
- **AC-2** — Given I reject, when the action completes, then the price **resets back to the original price**, per §5 — the draft treats Reject as a special case of Modify where the modified value equals the original.
- **AC-3** — Given I reject, when the action completes, then the buyer is notified with the reverted original price and must Accept or Reject it, per §6.
- **AC-4** — Given I reject, when the action completes, then the order returns to **Pending** status with a Cancel option still available to the buyer, per §5 MVP behaviour and §7.
- **AC-5** — Given I reject, when the action completes, then the rejection is written to the negotiation log.

⚠ **Spec gap 11 — blocking.** This is the draft's own circularity, and it is the reason §7's open question cannot be answered.

> §5: *"once rejected, the order returns to Pending status."*
> §7: *"Pending Order: while awaiting the seller's response, the buyer sees no action except a Cancel button."*

If Pending means *awaiting the seller's response*, then a rejected order is waiting for a response that has already happened. And §7 also says that after a Reject the buyer gets **Accept / Cancel** — which contradicts "no action except Cancel" in the same section.

The two readings, and what each costs:

| Reading | Meaning | Consequence |
|---|---|---|
| **A** | Pending is one status meaning "awaiting someone" | The status cannot tell buyer and seller whose turn it is. Notifications become the only signal. |
| **B** | Pending-after-reject is a *different* state from Pending-awaiting-seller | Needs a second status the draft never names, and the buyer's action set differs between them. |

The structural fix is to stop treating the **price negotiation** and the **order** as one object: the negotiation reaches a terminal outcome, and the order continues at whatever price was agreed or at list. **Decide this before writing a single line of E5.**

---

### S-405 — See requests grouped by type · **MVP** · §8

> **As a** seller,
> **I want** my incoming requests separated into Special Price Request, RFQ and Sent,
> **so that** I can work through the ones carrying evidence separately from the open-ended ones.

**Acceptance criteria**

- **AC-1** — Given I open the Inbox, when it renders, then three categories exist: **Special Price Request**, **RFQ**, **Sent** — per §8.
- **AC-2** — Given a request arrives, when it is categorised, then it appears under the category matching its route.
- **AC-3** — Given I have responded to a request, when I view **Sent**, then my response appears there.
- **AC-4** — Given I open any category, when it renders, then I can see what has been accepted and what has been rejected, per §8.

---

# E5 — Buyer response and order status
*Draft §6, §7*

---

### S-501 — Be left alone when the seller simply accepts · **MVP** · §6, §7

> **As a** buyer,
> **I want** no action required of me when the seller accepts my price as-is,
> **so that** an agreement doesn't cost me an extra confirmation step.

**Acceptance criteria**

- **AC-1** — Given the seller accepts as-is, when the response arrives, then I am **notified only** and no action is required, per §7.
- **AC-2** — Given the seller accepts as-is, when I view the order, then it proceeds normally at the accepted price.
- **AC-3** — Given the seller accepts as-is, when I view my available actions, then no Accept button is presented — there is nothing left to accept.
- **AC-4** — Given the seller accepts as-is, when the order is created, then it appears in Final Orders, per §9.

---

### S-502 — Compare the original price against the seller's price · **MVP** · §6

> **As a** buyer,
> **I want** the original price and the seller's price shown side by side,
> **so that** I can see what changed and decide in one screen.

**Acceptance criteria**

- **AC-1** — Given the seller has modified or rejected, when I open the request, then the original price and the seller's price are displayed **side by side**, per §6.
- **AC-2** — Given the seller rejected, when the comparison renders, then the seller's column shows the reverted original price and is identified as a rejection.
- **AC-3** — Given the request was a Special Price Request, when the comparison renders, then the price I asked for is also visible — see Spec gap 7.
- **AC-4** — Given the request covered a quantity, when the comparison renders, then the quantity and the resulting line total are shown, not only the unit price.

---

### S-503 — Accept or reject the seller's response · **MVP** · §6, §7

> **As a** buyer,
> **I want** two clear actions on whatever the seller sent back,
> **so that** the negotiation reaches an end.

**Acceptance criteria**

- **AC-1** — Given the seller has **modified**, when I view the request, then **Accept** and **Reject/Cancel** are both available, per §6.
- **AC-2** — Given the seller has **rejected**, when I view the request, then Accept and Cancel are both available, per §7 — Accept meaning I proceed at the original price.
- **AC-3** — Given the seller has **accepted as-is**, when I view the request, then neither action is presented, per §7 (*"buyer respond is available for modify/reject cases only"*).
- **AC-4** — Given I accept, when the action completes, then the order proceeds at the seller's price and moves to Final Orders.
- **AC-5** — Given I reject or cancel, when the action completes, then the order is cancelled, per §6 (*"Reject … /Cancel (cancels the order)"*).
- **AC-6** — Given I take either action, when it completes, then the seller is notified, per §8.

⚠ **Spec gap 12** — §6 makes the buyer's second action *"Reject the modified or original price / Cancel (cancels the order)"* — so for the buyer, rejecting **cancels the order**. But for the seller (§5), rejecting **keeps the order alive at the original price**. The same word means two different things depending on who clicks it. Either rename one of them, or state explicitly that buyer-Reject is terminal and seller-Reject is not.

---

### S-504 — Cancel while waiting · **MVP** · §7

> **As a** buyer,
> **I want** a Cancel button while my request is pending,
> **so that** I am not trapped waiting on a seller who may never respond.

**Acceptance criteria**

- **AC-1** — Given my order is **Pending** awaiting the seller, when I view it, then **Cancel** is the only action available, per §7.
- **AC-2** — Given my order returned to Pending after a seller rejection, when I view it, then Cancel remains available, per §5 MVP behaviour.
- **AC-3** — Given I cancel, when the action completes, then the order is cancelled and the seller is notified.
- **AC-4** — Given I cancel, when the action completes, then the cancellation is written to the negotiation log.

⚠ **Spec gap 13** — Nothing in the draft bounds how long a request can sit in Pending. There is no response deadline for the seller and no expiry on the request. Without one, "Pending" is unbounded and the buyer's only exit is to cancel. Also unspecified: what happens to a pending request if the product goes out of stock or its price changes.

⚠ **Spec gap 14 — §7's own open question, unanswered in the draft.** *"What exactly triggers/defines the seller 'approving' the order?"* As written this cannot be answered, because the draft uses one object for both the price negotiation and the order (see Spec gap 11). Once those are separated, the answer falls out: the **negotiation** ends when either side accepts a price; the **order** is then created at that price and follows the normal order lifecycle — and "seller approves the order" is not a negotiation step at all, it is the existing order-confirmation step.

---

# E6 — Notifications and Inbox
*Draft §8*

---

### S-601 — Be alerted when the other party acts · **MVP** · §8

> **As a** buyer or seller,
> **I want** to be notified whenever the other party takes an action on my request,
> **so that** I don't have to keep checking whether anything has happened.

**Acceptance criteria**

- **AC-1** — Given the seller accepts, modifies or rejects, when the action completes, then the buyer is notified.
- **AC-2** — Given the buyer accepts, rejects or cancels, when the action completes, then the seller is notified.
- **AC-3** — Given a new request is submitted, when it arrives, then the seller is notified.
- **AC-4** — Given a notification is raised, when I open it, then it takes me to the request it refers to.
- **AC-5** — Given notification delivery fails, when the failure occurs, then the underlying action still stands and is not rolled back.

⚠ **Spec gap 15** — The draft says *"Inbox and/or Notifications"* without deciding which. Are these one surface or two? Is there an email or push channel, or in-app only? Are there per-user preferences?

---

### S-602 — See what was accepted and rejected in one place · **MVP** · §8

> **As a** buyer or seller,
> **I want** the Inbox to show me what has been accepted and rejected,
> **so that** I have a single view of every negotiation's outcome without opening each one.

**Acceptance criteria**

- **AC-1** — Given I open the Inbox, when it renders, then each entry shows its current outcome — accepted, rejected, or awaiting a response.
- **AC-2** — Given an outcome changes, when the Inbox is next viewed, then the entry reflects the change.
- **AC-3** — Given I select an entry, when it opens, then I see the full request including quantity, prices and any attachment.

---

### S-603 — Work the Inbox by category · **MVP** · §8

> **As a** buyer,
> **I want** my Inbox split into Special Price Request, RFQ and Sent,
> **so that** I can tell my evidenced asks apart from my open quote requests.

**Acceptance criteria**

- **AC-1** — Given I open the Inbox, when it renders, then the three categories from §8 are present.
- **AC-2** — Given I submitted a request, when I look under **Sent**, then it appears there.
- **AC-3** — Given a category has no entries, when it renders, then an empty state explains what would appear there.

⚠ **Spec gap 16** — §8 lists the categories once, without saying whether the buyer and the seller see the same three. "Sent" means something different to each side: the buyer's sent *requests* versus the seller's sent *responses*.

---

# E7 — Final Orders, negotiation log and admin visibility
*Draft §9, §10*

---

### S-701 — See negotiated and standard orders together in Final Orders · **MVP** · §9

> **As a** buyer or seller,
> **I want** approved negotiated orders to join standard orders in Final Orders,
> **so that** I have one list of real orders rather than two parallel worlds.

**Acceptance criteria**

- **AC-1** — Given an order never involved an RFQ or special price, when it is placed, then it appears in Final Orders, per §9.
- **AC-2** — Given a negotiated order is approved, when approval completes, then it **moves into Final Orders status**, per §9.
- **AC-3** — Given a negotiated order in Final Orders, when I view it, then it shows an indicator of the **original (old) price versus the accepted price**, per §9.
- **AC-4** — Given a standard order in Final Orders, when I view it, then no price-comparison indicator is shown.

⚠ **Spec gap 17** — "Approved" is used here without a definition, and it is the same word §7 flags as unresolved. Until Spec gap 14 is closed, the trigger that moves an order into Final Orders is undefined.

---

### S-702 — Keep a full log of the back-and-forth · **MVP** · §9, §10

> **As a** buyer, seller or HB Admin,
> **I want** every action in the negotiation retained and viewable,
> **so that** there is no dispute about what was asked, offered or agreed.

**Acceptance criteria**

- **AC-1** — Given a negotiation has taken place, when I open its log, then **all** back-and-forth actions between buyer and seller are listed, per §9.
- **AC-2** — Given a log entry, when it renders, then it shows who acted, what they did, the price before and after, and when.
- **AC-3** — Given a negotiation is complete, when time passes, then the log remains retained and viewable, per §9.
- **AC-4** — Given any user views the log, when it renders, then entries cannot be edited or deleted from the interface.

⚠ **Spec gap 18** — Retention period is unspecified. So is whether the log is exportable, and whether the buyer sees the same log the seller and HB Admin see.

---

### S-703 — Tell at a glance that an order was negotiated · **MVP** · §10

> **As an** HB Admin,
> **I want** the order page to show that an order went through special price negotiation and whether proof was submitted,
> **so that** I can follow up on past orders where the price was changed.

**Acceptance criteria**

- **AC-1** — Given an order that went through negotiation, when I open the order page, then it is clearly indicated as such, per §10.
- **AC-2** — Given the negotiation included an attachment, when I open the order page, then it indicates that an invoice/proof was submitted and lets me open it, per §10.
- **AC-3** — Given the negotiation had no attachment (RFQ path), when I open the order page, then it indicates that no proof was submitted.
- **AC-4** — Given any negotiated order, when I open the order page, then the full negotiation history is visible on the order, per §10.
- **AC-5** — Given an order that never went through negotiation, when I open it, then none of these indicators are rendered.

---

### S-704 — Find past orders where the price was changed · **MVP** · §10

> **As an** HB Admin,
> **I want** to identify orders whose price was changed through negotiation,
> **so that** I can audit them without opening every order in the system.

**Acceptance criteria**

- **AC-1** — Given the orders list, when it renders, then negotiated orders are distinguishable from standard ones.
- **AC-2** — Given I need to review negotiated orders, when I filter or search, then I can isolate orders that went through special price negotiation.
- **AC-3** — Given I open one from that list, when it renders, then I land on the negotiation history described in S-703.

⚠ **Spec gap 19** — §10 states the *need* (*"so HB Admins can follow up on past orders where the price was changed"*) but describes only the single-order view. Whether admins get a list, a filter, or a report is not specified. This story assumes the minimum that satisfies the stated need.

---

# E8 — Phase 2 scope
*Draft §11*

---

### S-801 — Price against a stated buying frequency · **Phase 2** · §4, §11

> **As a** seller,
> **I want** to see how often the buyer intends to reorder,
> **so that** I can price a recurring commitment differently from a one-off.

**Acceptance criteria**

- **AC-1** — Given frequency is released, when a buyer submits an RFQ, then frequency is captured alongside quantity.
- **AC-2** — Given a request carries a frequency, when I open it, then the frequency is displayed with the quantity.
- **AC-3** — Given frequency is captured, when I create a template (S-402), then the frequency is available as an input to that template.

**Depends on:** S-303, S-402. See Spec gap 8 on input type.

---

### S-802 — Special Credit (استمرارية / continuity) · **Phase 2** · §11

> **As a** buyer,
> **I want** continuity on an agreed special price,
> **so that** a negotiated relationship carries forward rather than resetting each order.

**Acceptance criteria**

- Not yet defined. The draft names Special Credit as Phase 2 scope and gives no behaviour, no actor detail and no acceptance conditions.

⚠ **Spec gap 20 — placeholder only.** *"Special Credit (استمرارية / continuity)"* is a single line in §11. It is unclear whether this is a **credit facility** (payment terms), a **loyalty or continuity discount**, or another name for the template mechanism in S-402. **Do not estimate.** This story exists to hold the slot in the backlog, not to be groomed.

---

# Traceability — every draft section to its stories

| Draft section | Covered by | Notes |
|---|---|---|
| §1 Overview — two paths, direction of negotiation | S-103, S-302 | The "stronger than a generic quote" framing drives S-204 |
| §2 Entry point — button, quantity | S-101, S-102 | |
| §3 Case 1 — proof, disabled price input, AI validation | S-201, S-202, S-203, S-204 | Validation is an external dependency |
| §4 Case 2 — RFQ, frequency, combinable paths | S-301, S-302, S-303, S-103 | Frequency deferred per the draft |
| §5 Seller actions — Accept, template, Modify, Reject | S-401, S-402, S-403, S-404 | Reject carries the circularity |
| §6 Buyer actions — notify, compare, Accept/Reject | S-501, S-502, S-503 | |
| §7 Order status — Pending, Cancel, open question | S-503, S-504 | §7's open question = Spec gap 14 |
| §8 Notifications & Inbox — categories | S-601, S-602, S-603, S-405 | |
| §9 Final Orders — indicator, log | S-701, S-702 | |
| §10 Order page / admin visibility | S-703, S-704 | |
| §11 Phase 2 — frequency, Special Credit | S-801, S-802 | Special Credit is a placeholder |

**Coverage: 11 of 11 sections.** No story exists that does not trace to the draft.

---

# Blocking questions

Four of the twenty spec gaps stop estimation. The other sixteen can be answered during grooming.

| # | Question | Blocks | Owner |
|---|---|---|---|
| **B1** | Is a request **per item** or **one request with many lines**? (Spec gap 3) | E4, E5, E7 — all of them | PM |
| **B2** | What does the price negotiation returning to **Pending** mean, and does Reject end the negotiation or the order? (Spec gaps 11, 12, 14) | E5 entirely | PM |
| **B3** | What is a **template**: scope, expiry, quantity conditions, conflict rule, ownership? (Spec gap 9) | S-402 | PM + Commercial |
| **B4** | What happens when **invoice validation fails or is unavailable** — block, or flag and pass through? Interface contract and date? (Spec gap 5) | E2 | Omar's team + PM |

**Answerable in grooming:** eligibility rules (1), quantity units and stock (2), disabled-input messaging (4), file types and limits (6), three-column comparison on Case 1 (7), frequency input type (8), Modify round cap (10), pending expiry and stale requests (13), Inbox vs Notifications (15), per-actor Inbox categories (16), definition of "approved" (17), log retention and visibility (18), admin list or filter (19), Special Credit definition (20).

---

# Appendix — suggested ticket slicing

One ticket per story is the default. Four stories are large enough to split.

| Story | Split into |
|---|---|
| **S-201** | (a) Case 1 form + attachment control · (b) disabled/enabled price-input behaviour · (c) submission payload and validation rules |
| **S-202** | (a) integration with the invoice-reading service · (b) buyer-facing result states · (c) seller-facing result display · (d) failure and timeout handling |
| **S-402** | (a) template data model and lifecycle · (b) create/modify template UI · (c) template application at pricing time |
| **S-702** | (a) log event capture on every action · (b) log view for buyer and seller · (c) log view for HB Admin on the order page |

**Recommended build order:** E1 → E3 → E4 (minus S-402) → E5 → E6 → E7 → E2 → S-402 → E8.

RFQ before Special Price Request is deliberate. The RFQ path needs no attachment and no external validation dependency, so it exercises the whole request → respond → accept loop end to end while B4 is still being answered. Special Price Request then adds only the proof layer on top of a loop that already works.
