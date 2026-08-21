/**
 * The user-story register, as data.
 *
 * Kept alongside docs/HIGHBASE-Special-Price-RFQ-User-Stories.md, which is the document
 * of record. This module exists so the register can be filtered and counted rather than
 * only scrolled — the twenty spec gaps are the reason the document exists, and they are
 * unfindable in a flat read.
 */

export type Phase = 'MVP' | 'Phase 2'

export interface Reading {
  label: string
  meaning?: string
  consequence: string
}

export interface Gap {
  n: number
  blocking?: boolean
  /** The question itself, in the document's own words. */
  body: string
  points?: string[]
  quotes?: string[]
  readings?: Reading[]
  closer?: string
}

export interface Story {
  id: string
  epic: string
  title: string
  phase: Phase
  sections: string
  role: string
  want: string
  soThat: string
  acs: string[]
  note?: string
  depends?: string
  gaps: Gap[]
}

export interface Epic {
  id: string
  title: string
  sections: string
}

export const EPICS: Epic[] = [
  { id: 'E1', title: 'Entry point and request creation', sections: '§1, §2' },
  { id: 'E2', title: 'Case 1 — Special Price Request with proof', sections: '§3' },
  { id: 'E3', title: 'Case 2 — RFQ without proof', sections: '§4' },
  { id: 'E4', title: 'Seller response actions', sections: '§5' },
  { id: 'E5', title: 'Buyer response and order status', sections: '§6, §7' },
  { id: 'E6', title: 'Notifications and Inbox', sections: '§8' },
  { id: 'E7', title: 'Final Orders, negotiation log, admin visibility', sections: '§9, §10' },
  { id: 'E8', title: 'Phase 2 scope', sections: '§11' },
]

export const STORIES: Story[] = [
  {
    id: 'S-101', epic: 'E1', phase: 'MVP', sections: '§2',
    title: 'Request a special price from the product card',
    role: 'buyer',
    want: 'to request a special price directly from the product card',
    soThat: 'I can start a price negotiation at the moment I see a price I don’t want to pay, without leaving the product.',
    acs: [
      'Given I am viewing a product card, when the card renders, then a **Request Special Price** button is visible on the card.',
      'Given I click **Request Special Price**, when the request flow opens, then the product I clicked from is carried into the request and shown to me.',
      'Given the request flow is open, when I abandon it without submitting, then no request is created and no notification is sent to the seller.',
      'Given I submit a request, when submission succeeds, then I receive a confirmation that the request has been sent to the seller.',
    ],
    gaps: [{
      n: 1,
      body: 'The draft does not say which products carry the button. Is it every product, only products from linked sellers, only products above a quantity or value threshold, or seller-configurable? This changes both the catalogue work and the expected request volume.',
    }],
  },
  {
    id: 'S-102', epic: 'E1', phase: 'MVP', sections: '§2',
    title: 'State the quantity being requested',
    role: 'buyer',
    want: 'to enter the quantity I am requesting a price for',
    soThat: 'the seller is pricing the volume I actually intend to buy.',
    acs: [
      'Given the request flow is open, when the first step renders, then a quantity input is present and required.',
      'Given I have not entered a quantity, when I try to continue, then I am blocked and told that quantity is required.',
      'Given I enter a quantity, when I continue, then the quantity is carried through to both the Case 1 and the Case 2 path unchanged.',
      'Given the request is submitted, when the seller views it, then the quantity is displayed to the seller.',
    ],
    gaps: [{
      n: 2,
      body: 'The draft does not specify the unit (pieces, cases, cartons), whether there is a minimum, or what happens when the requested quantity exceeds available stock.',
    }],
  },
  {
    id: 'S-103', epic: 'E1', phase: 'MVP', sections: '§1, §4',
    title: 'Choose between Special Price Request and RFQ per item',
    role: 'buyer',
    want: 'both request paths offered together on the item I am requesting',
    soThat: 'I can pick the route that matches what I actually have — a price to prove, or a price to ask for.',
    acs: [
      'Given I am creating a request for an item, when the request options render, then **both** Special Price Request and RFQ are presented together for that item, per the draft’s *“presented together/combinable under each item.”*',
      'Given I select one route for an item, when I continue, then only that route’s fields are collected for that item.',
      'Given I select the Special Price Request route, when the form renders, then the price input behaves as described in S-201.',
      'Given I select the RFQ route, when the form renders, then no attachment is requested.',
    ],
    gaps: [{
      n: 3, blocking: true,
      body: '*“Combinable under each item”* is the single most consequential ambiguity in the draft. Two readings are possible and they produce different products:',
      readings: [
        { label: 'A — per item', meaning: 'Each item generates its own request, its own seller decision, its own status.', consequence: 'A buyer wanting better prices on 5 SKUs creates 5 negotiations. There is no “what is this order worth” answer for either side.' },
        { label: 'B — one request, many lines', meaning: 'One request contains N items, each line carrying its own route.', consequence: 'One seller decision, one status, one log. Requires a request container object that the draft never mentions.' },
      ],
      closer: 'Every story in E4, E5 and E7 is written differently depending on the answer. **This must be decided before E4 is estimated.** The benchmark analysis recommends Reading B; the draft as written reads closer to A.',
    }],
  },

  {
    id: 'S-201', epic: 'E2', phase: 'MVP', sections: '§3',
    title: 'Submit a price ask backed by proof',
    role: 'buyer',
    want: 'to state the specific price I want and attach an invoice or proof for it',
    soThat: 'my ask carries evidence and is treated as stronger than a generic quote request.',
    acs: [
      'Given I chose the Special Price Request route, when the form renders, then it contains a price input and an attachment control.',
      'Given no attachment has been added, when the form renders, then the price input is **closed/disabled** — as specified in the draft.',
      'Given I add a valid attachment, when the upload completes, then the price input becomes enabled and editable.',
      'Given I remove the attachment after entering a price, when the attachment is removed, then the price input returns to its disabled state.',
      'Given quantity, price ask and attachment are all present, when I submit, then all three are transmitted to the seller as one request.',
      'Given I attempt to submit without an attachment, when I submit, then submission is blocked, because proof is mandatory on this path.',
    ],
    gaps: [{
      n: 4,
      body: 'The draft mandates a disabled price input as the mechanism for signalling “proof required,” but does not say whether the buyer is told *why* it is disabled. A silently disabled field with no stated reason is the pattern the earlier HIGHBASE usability audit flagged across the admin. Minimum fix inside the draft’s own design: a visible helper message on the disabled input. Recommended alternative: an explicit route choice (S-103, Reading B).',
    }],
  },
  {
    id: 'S-202', epic: 'E2', phase: 'MVP', sections: '§3',
    title: 'Have the uploaded proof validated automatically',
    role: 'buyer',
    want: 'the system to check that what I uploaded is actually a valid invoice',
    soThat: 'I find out my proof is unusable before the seller does, not after.',
    acs: [
      'Given I upload a file, when the upload completes, then the invoice-reading validation is invoked (the solution being built by Omar’s team).',
      'Given validation determines a valid invoice was uploaded, when the result returns, then the request may proceed to submission.',
      'Given validation determines no valid invoice was uploaded, when the result returns, then I am informed and told what is wrong.',
      'Given validation is unavailable or times out, when I attempt to submit, then the submission path is defined and deterministic — see Spec gap 5.',
      'Given a request was submitted, when the seller opens it, then the validation outcome is visible to the seller alongside the file.',
    ],
    gaps: [{
      n: 5, blocking: true,
      body: 'The draft says validation “checks whether a valid invoice was actually uploaded” but never says what happens when it fails. Four questions, all of which change the flow:',
      points: [
        'Does a failed validation **block submission**, or **flag** the request and let it through?',
        'Is the outcome shown to the **buyer**, the **seller**, or both?',
        'What happens when the validation service is **down** — block, or pass through unvalidated?',
        'Is validation a **hard gate** or **advisory input to the seller’s judgement**?',
      ],
      closer: 'This is an integration dependency on another team, so it also needs an interface contract and a delivery date before E2 can be committed.',
    }],
  },
  {
    id: 'S-203', epic: 'E2', phase: 'MVP', sections: '§3, §10',
    title: 'Attach the proof file to the request record',
    role: 'seller',
    want: 'the buyer’s attachment stored with the request and openable from it',
    soThat: 'I can look at the evidence before deciding, and it is still there when someone reviews the order later.',
    acs: [
      'Given a request with an attachment, when I open the request, then I can view or download the attached file.',
      'Given a request with an attachment, when the request becomes an order, then the attachment remains retrievable from the order record.',
      'Given a request with an attachment, when an HB Admin views the order, then the attachment is accessible to them (see S-703).',
      'Given a file type or size outside what is supported, when the buyer uploads it, then the upload is rejected with the supported formats and limit stated.',
    ],
    gaps: [{
      n: 6,
      body: 'The draft does not state accepted file types, size limits, how many files per request, or the retention period.',
    }],
  },
  {
    id: 'S-204', epic: 'E2', phase: 'MVP', sections: '§3, §10',
    title: 'See that a request carries proof',
    role: 'seller',
    want: 'to see immediately that a request is a Special Price Request rather than an RFQ',
    soThat: 'I know whether there is evidence to weigh before I open it.',
    acs: [
      'Given a list of incoming requests, when it renders, then each entry indicates whether it is a Special Price Request (with proof) or an RFQ (no proof).',
      'Given a Special Price Request, when I open it, then the buyer’s asked price, the quantity and the attachment are all visible on one screen.',
      'Given an RFQ, when I open it, then no attachment section is rendered — not an empty one.',
    ],
    gaps: [],
  },

  {
    id: 'S-301', epic: 'E3', phase: 'MVP', sections: '§4',
    title: 'Ask the seller to quote when I have no proof',
    role: 'buyer',
    want: 'to send the seller my quantity and ask them to quote a price',
    soThat: 'I can still open a negotiation when I have no invoice to attach.',
    acs: [
      'Given I have no attachment, when I am in the request flow, then the RFQ route is available to me.',
      'Given I choose the RFQ route, when the form renders, then quantity is collected and no price ask is requested from me.',
      'Given I submit an RFQ, when submission succeeds, then the seller receives it identified as an RFQ.',
      'Given I submit an RFQ, when the seller views it, then they are being asked to state a price — the direction of the negotiation is reversed relative to Case 1, per §1.',
    ],
    gaps: [],
  },
  {
    id: 'S-302', epic: 'E3', phase: 'MVP', sections: '§1, §4',
    title: 'Receive a seller-initiated quote',
    role: 'buyer',
    want: 'the seller to come back to me with their quoted price',
    soThat: 'I have a number to accept or reject even though I never named one.',
    acs: [
      'Given a seller quotes against my RFQ, when the response arrives, then I am notified (see S-601).',
      'Given a seller has quoted, when I open the request, then the quoted price and the original price are both shown.',
      'Given a seller has quoted, when I view my available actions, then Accept and Reject/Cancel are available, consistent with §6.',
    ],
    gaps: [{
      n: 7,
      body: '§6 describes the buyer’s comparison as *“the original price vs. the seller’s modified/accepted price.”* On the RFQ path the buyer never stated a price, so only two numbers exist. On the Special Price Request path there are **three** — original, what the buyer asked, and what the seller offered. The draft’s comparison screen needs to handle both shapes.',
    }],
  },
  {
    id: 'S-303', epic: 'E3', phase: 'Phase 2', sections: '§4, §11',
    title: 'Tell the seller how often I will buy',
    role: 'buyer',
    want: 'to state how frequently I expect to reorder',
    soThat: 'the seller can price for a recurring commitment rather than a one-off.',
    acs: [
      'Given the RFQ form, when frequency is enabled, then a frequency input is present alongside quantity.',
      'Given I submit an RFQ with a frequency, when the seller views it, then the frequency is displayed.',
      'Given frequency is not yet released, when the RFQ form renders, then quantity ships alone and no disabled or placeholder frequency field is shown.',
    ],
    note: 'The draft is explicit that *“quantity ships first”* and frequency is a Phase 2 addition. Sequenced accordingly; do not build a hidden or disabled control in the MVP.',
    gaps: [{
      n: 8,
      body: 'Frequency’s input type is unspecified: free text, or a controlled list (one-off / weekly / monthly)? A controlled list is required if frequency is ever to drive a template or a recurring order.',
    }],
  },

  {
    id: 'S-401', epic: 'E4', phase: 'MVP', sections: '§5',
    title: 'Accept the buyer’s price for this order only',
    role: 'seller',
    want: 'to accept the buyer’s requested price as a one-time acceptance',
    soThat: 'I can close this deal without committing to that price in future.',
    acs: [
      'Given an incoming Special Price Request or RFQ, when I open it, then **Accept** is available as an action.',
      'Given I accept, when the action completes, then the price applies to this order only and no template is created.',
      'Given I accept, when the action completes, then the buyer is notified and **no buyer action is required** — the order proceeds normally, per §6.',
      'Given I accept, when the order is created, then it moves into Final Orders, per §9.',
      'Given I accept, when the action completes, then the acceptance is written to the negotiation log (see S-702).',
    ],
    gaps: [],
  },
  {
    id: 'S-402', epic: 'E4', phase: 'MVP', sections: '§5',
    title: 'Accept and save the price as a reusable template',
    role: 'seller',
    want: 'to accept a price and save it as a template that applies going forward',
    soThat: 'I am not renegotiating the same product with the same buyer every time.',
    acs: [
      'Given I am responding to a request, when I view my actions, then **Accept & apply as template** is available and distinct from plain Accept.',
      'Given I choose it, when I confirm, then the accepted special price is saved so it applies to future orders.',
      'Given a template already exists for this combination, when I choose the action, then I can **modify the existing template**, per §5.',
      'Given no template exists, when I choose the action, then I can **create a new/specific template**, per §5.',
      'Given a template is active, when the buyer next views that product, then the template price is what applies.',
      'Given a template is created, when the negotiation log is viewed, then the template creation and its parameters are recorded.',
    ],
    gaps: [{
      n: 9, blocking: true,
      body: '*“Apply going forward”* is undefined, and a template is a pricing object with a lifecycle the draft never describes:',
      points: [
        '**Scope** — does the template apply to this **buyer only**, a buyer **group**, or **all buyers**?',
        '**Expiry** — does it ever end? On a date, after N orders, never?',
        '**Quantity conditions** — does the price hold at any quantity, or only at or above the quantity negotiated?',
        '**Conflict** — what happens when a template already exists and a new one is created for the same product and buyer? *(§5 says the seller “can modify an existing template or create a new/specific one” — it does not say which wins.)*',
        '**Ownership** — who can edit or revoke a template afterwards?',
      ],
      closer: 'A price that applies indefinitely, to an undefined audience, with no expiry, is a commercial risk, not just a spec gap. **This cannot be estimated as written.**',
    }],
  },
  {
    id: 'S-403', epic: 'E4', phase: 'MVP', sections: '§5',
    title: 'Counter with a modified price',
    role: 'seller',
    want: 'to respond with a modified special price rather than a flat yes or no',
    soThat: 'I can meet the buyer partway instead of losing the order.',
    acs: [
      'Given an incoming request, when I open it, then **Modify** is available.',
      'Given I choose Modify, when the input renders, then I can enter a different price from the one requested.',
      'Given I submit a modified price, when it transmits, then the buyer is notified with the new price and must Accept or Reject it, per §6.',
      'Given I have modified, when the buyer views the request, then the original price and my modified price are shown side by side, per §6.',
      'Given I modify, when the action completes, then the modification is written to the negotiation log with both the previous and the new value.',
    ],
    gaps: [{
      n: 10,
      body: 'The draft does not cap the number of Modify rounds, nor does it say whether the buyer can counter back with their own number, or only Accept/Reject what the seller sent. §6 implies the latter — the buyer gets Accept or Reject only — which means the negotiation is at most two moves deep. Confirm this is intended.',
    }],
  },
  {
    id: 'S-404', epic: 'E4', phase: 'MVP', sections: '§5',
    title: 'Reject and keep the original price',
    role: 'seller',
    want: 'to reject the request and keep my original price',
    soThat: 'I can decline a price I can’t offer without cancelling the buyer’s order.',
    acs: [
      'Given an incoming request, when I open it, then **Reject** is available.',
      'Given I reject, when the action completes, then the price **resets back to the original price**, per §5 — the draft treats Reject as a special case of Modify where the modified value equals the original.',
      'Given I reject, when the action completes, then the buyer is notified with the reverted original price and must Accept or Reject it, per §6.',
      'Given I reject, when the action completes, then the order returns to **Pending** status with a Cancel option still available to the buyer, per §5 MVP behaviour and §7.',
      'Given I reject, when the action completes, then the rejection is written to the negotiation log.',
    ],
    gaps: [{
      n: 11, blocking: true,
      body: 'This is the draft’s own circularity, and it is the reason §7’s open question cannot be answered.',
      quotes: [
        '§5: *“once rejected, the order returns to Pending status.”*',
        '§7: *“Pending Order: while awaiting the seller’s response, the buyer sees no action except a Cancel button.”*',
      ],
      points: [
        'If Pending means *awaiting the seller’s response*, then a rejected order is waiting for a response that has already happened.',
        '§7 also says that after a Reject the buyer gets **Accept / Cancel** — which contradicts “no action except Cancel” in the same section.',
      ],
      readings: [
        { label: 'A', meaning: 'Pending is one status meaning “awaiting someone”.', consequence: 'The status cannot tell buyer and seller whose turn it is. Notifications become the only signal.' },
        { label: 'B', meaning: 'Pending-after-reject is a *different* state from Pending-awaiting-seller.', consequence: 'Needs a second status the draft never names, and the buyer’s action set differs between them.' },
      ],
      closer: 'The structural fix is to stop treating the **price negotiation** and the **order** as one object: the negotiation reaches a terminal outcome, and the order continues at whatever price was agreed or at list. **Decide this before writing a single line of E5.**',
    }],
  },
  {
    id: 'S-405', epic: 'E4', phase: 'MVP', sections: '§8',
    title: 'See requests grouped by type',
    role: 'seller',
    want: 'my incoming requests separated into Special Price Request, RFQ and Sent',
    soThat: 'I can work through the ones carrying evidence separately from the open-ended ones.',
    acs: [
      'Given I open the Inbox, when it renders, then three categories exist: **Special Price Request**, **RFQ**, **Sent** — per §8.',
      'Given a request arrives, when it is categorised, then it appears under the category matching its route.',
      'Given I have responded to a request, when I view **Sent**, then my response appears there.',
      'Given I open any category, when it renders, then I can see what has been accepted and what has been rejected, per §8.',
    ],
    gaps: [],
  },

  {
    id: 'S-501', epic: 'E5', phase: 'MVP', sections: '§6, §7',
    title: 'Be left alone when the seller simply accepts',
    role: 'buyer',
    want: 'no action required of me when the seller accepts my price as-is',
    soThat: 'an agreement doesn’t cost me an extra confirmation step.',
    acs: [
      'Given the seller accepts as-is, when the response arrives, then I am **notified only** and no action is required, per §7.',
      'Given the seller accepts as-is, when I view the order, then it proceeds normally at the accepted price.',
      'Given the seller accepts as-is, when I view my available actions, then no Accept button is presented — there is nothing left to accept.',
      'Given the seller accepts as-is, when the order is created, then it appears in Final Orders, per §9.',
    ],
    gaps: [],
  },
  {
    id: 'S-502', epic: 'E5', phase: 'MVP', sections: '§6',
    title: 'Compare the original price against the seller’s price',
    role: 'buyer',
    want: 'the original price and the seller’s price shown side by side',
    soThat: 'I can see what changed and decide in one screen.',
    acs: [
      'Given the seller has modified or rejected, when I open the request, then the original price and the seller’s price are displayed **side by side**, per §6.',
      'Given the seller rejected, when the comparison renders, then the seller’s column shows the reverted original price and is identified as a rejection.',
      'Given the request was a Special Price Request, when the comparison renders, then the price I asked for is also visible — see Spec gap 7.',
      'Given the request covered a quantity, when the comparison renders, then the quantity and the resulting line total are shown, not only the unit price.',
    ],
    gaps: [],
  },
  {
    id: 'S-503', epic: 'E5', phase: 'MVP', sections: '§6, §7',
    title: 'Accept or reject the seller’s response',
    role: 'buyer',
    want: 'two clear actions on whatever the seller sent back',
    soThat: 'the negotiation reaches an end.',
    acs: [
      'Given the seller has **modified**, when I view the request, then **Accept** and **Reject/Cancel** are both available, per §6.',
      'Given the seller has **rejected**, when I view the request, then Accept and Cancel are both available, per §7 — Accept meaning I proceed at the original price.',
      'Given the seller has **accepted as-is**, when I view the request, then neither action is presented, per §7 (*“buyer respond is available for modify/reject cases only”*).',
      'Given I accept, when the action completes, then the order proceeds at the seller’s price and moves to Final Orders.',
      'Given I reject or cancel, when the action completes, then the order is cancelled, per §6 (*“Reject … /Cancel (cancels the order)”*).',
      'Given I take either action, when it completes, then the seller is notified, per §8.',
    ],
    gaps: [{
      n: 12,
      body: '§6 makes the buyer’s second action *“Reject the modified or original price / Cancel (cancels the order)”* — so for the buyer, rejecting **cancels the order**. But for the seller (§5), rejecting **keeps the order alive at the original price**. The same word means two different things depending on who clicks it. Either rename one of them, or state explicitly that buyer-Reject is terminal and seller-Reject is not.',
    }],
  },
  {
    id: 'S-504', epic: 'E5', phase: 'MVP', sections: '§7',
    title: 'Cancel while waiting',
    role: 'buyer',
    want: 'a Cancel button while my request is pending',
    soThat: 'I am not trapped waiting on a seller who may never respond.',
    acs: [
      'Given my order is **Pending** awaiting the seller, when I view it, then **Cancel** is the only action available, per §7.',
      'Given my order returned to Pending after a seller rejection, when I view it, then Cancel remains available, per §5 MVP behaviour.',
      'Given I cancel, when the action completes, then the order is cancelled and the seller is notified.',
      'Given I cancel, when the action completes, then the cancellation is written to the negotiation log.',
    ],
    gaps: [
      {
        n: 13,
        body: 'Nothing in the draft bounds how long a request can sit in Pending. There is no response deadline for the seller and no expiry on the request. Without one, “Pending” is unbounded and the buyer’s only exit is to cancel. Also unspecified: what happens to a pending request if the product goes out of stock or its price changes.',
      },
      {
        n: 14,
        body: '**§7’s own open question, unanswered in the draft.** *“What exactly triggers/defines the seller ‘approving’ the order?”* As written this cannot be answered, because the draft uses one object for both the price negotiation and the order (see Spec gap 11). Once those are separated, the answer falls out: the **negotiation** ends when either side accepts a price; the **order** is then created at that price and follows the normal order lifecycle — and “seller approves the order” is not a negotiation step at all, it is the existing order-confirmation step.',
      },
    ],
  },

  {
    id: 'S-601', epic: 'E6', phase: 'MVP', sections: '§8',
    title: 'Be alerted when the other party acts',
    role: 'buyer or seller',
    want: 'to be notified whenever the other party takes an action on my request',
    soThat: 'I don’t have to keep checking whether anything has happened.',
    acs: [
      'Given the seller accepts, modifies or rejects, when the action completes, then the buyer is notified.',
      'Given the buyer accepts, rejects or cancels, when the action completes, then the seller is notified.',
      'Given a new request is submitted, when it arrives, then the seller is notified.',
      'Given a notification is raised, when I open it, then it takes me to the request it refers to.',
      'Given notification delivery fails, when the failure occurs, then the underlying action still stands and is not rolled back.',
    ],
    gaps: [{
      n: 15,
      body: 'The draft says *“Inbox and/or Notifications”* without deciding which. Are these one surface or two? Is there an email or push channel, or in-app only? Are there per-user preferences?',
    }],
  },
  {
    id: 'S-602', epic: 'E6', phase: 'MVP', sections: '§8',
    title: 'See what was accepted and rejected in one place',
    role: 'buyer or seller',
    want: 'the Inbox to show me what has been accepted and rejected',
    soThat: 'I have a single view of every negotiation’s outcome without opening each one.',
    acs: [
      'Given I open the Inbox, when it renders, then each entry shows its current outcome — accepted, rejected, or awaiting a response.',
      'Given an outcome changes, when the Inbox is next viewed, then the entry reflects the change.',
      'Given I select an entry, when it opens, then I see the full request including quantity, prices and any attachment.',
    ],
    gaps: [],
  },
  {
    id: 'S-603', epic: 'E6', phase: 'MVP', sections: '§8',
    title: 'Work the Inbox by category',
    role: 'buyer',
    want: 'my Inbox split into Special Price Request, RFQ and Sent',
    soThat: 'I can tell my evidenced asks apart from my open quote requests.',
    acs: [
      'Given I open the Inbox, when it renders, then the three categories from §8 are present.',
      'Given I submitted a request, when I look under **Sent**, then it appears there.',
      'Given a category has no entries, when it renders, then an empty state explains what would appear there.',
    ],
    gaps: [{
      n: 16,
      body: '§8 lists the categories once, without saying whether the buyer and the seller see the same three. “Sent” means something different to each side: the buyer’s sent *requests* versus the seller’s sent *responses*.',
    }],
  },

  {
    id: 'S-701', epic: 'E7', phase: 'MVP', sections: '§9',
    title: 'See negotiated and standard orders together in Final Orders',
    role: 'buyer or seller',
    want: 'approved negotiated orders to join standard orders in Final Orders',
    soThat: 'I have one list of real orders rather than two parallel worlds.',
    acs: [
      'Given an order never involved an RFQ or special price, when it is placed, then it appears in Final Orders, per §9.',
      'Given a negotiated order is approved, when approval completes, then it **moves into Final Orders status**, per §9.',
      'Given a negotiated order in Final Orders, when I view it, then it shows an indicator of the **original (old) price versus the accepted price**, per §9.',
      'Given a standard order in Final Orders, when I view it, then no price-comparison indicator is shown.',
    ],
    gaps: [{
      n: 17,
      body: '“Approved” is used here without a definition, and it is the same word §7 flags as unresolved. Until Spec gap 14 is closed, the trigger that moves an order into Final Orders is undefined.',
    }],
  },
  {
    id: 'S-702', epic: 'E7', phase: 'MVP', sections: '§9, §10',
    title: 'Keep a full log of the back-and-forth',
    role: 'buyer, seller or HB Admin',
    want: 'every action in the negotiation retained and viewable',
    soThat: 'there is no dispute about what was asked, offered or agreed.',
    acs: [
      'Given a negotiation has taken place, when I open its log, then **all** back-and-forth actions between buyer and seller are listed, per §9.',
      'Given a log entry, when it renders, then it shows who acted, what they did, the price before and after, and when.',
      'Given a negotiation is complete, when time passes, then the log remains retained and viewable, per §9.',
      'Given any user views the log, when it renders, then entries cannot be edited or deleted from the interface.',
    ],
    gaps: [{
      n: 18,
      body: 'Retention period is unspecified. So is whether the log is exportable, and whether the buyer sees the same log the seller and HB Admin see.',
    }],
  },
  {
    id: 'S-703', epic: 'E7', phase: 'MVP', sections: '§10',
    title: 'Tell at a glance that an order was negotiated',
    role: 'HB Admin',
    want: 'the order page to show that an order went through special price negotiation and whether proof was submitted',
    soThat: 'I can follow up on past orders where the price was changed.',
    acs: [
      'Given an order that went through negotiation, when I open the order page, then it is clearly indicated as such, per §10.',
      'Given the negotiation included an attachment, when I open the order page, then it indicates that an invoice/proof was submitted and lets me open it, per §10.',
      'Given the negotiation had no attachment (RFQ path), when I open the order page, then it indicates that no proof was submitted.',
      'Given any negotiated order, when I open the order page, then the full negotiation history is visible on the order, per §10.',
      'Given an order that never went through negotiation, when I open it, then none of these indicators are rendered.',
    ],
    gaps: [],
  },
  {
    id: 'S-704', epic: 'E7', phase: 'MVP', sections: '§10',
    title: 'Find past orders where the price was changed',
    role: 'HB Admin',
    want: 'to identify orders whose price was changed through negotiation',
    soThat: 'I can audit them without opening every order in the system.',
    acs: [
      'Given the orders list, when it renders, then negotiated orders are distinguishable from standard ones.',
      'Given I need to review negotiated orders, when I filter or search, then I can isolate orders that went through special price negotiation.',
      'Given I open one from that list, when it renders, then I land on the negotiation history described in S-703.',
    ],
    gaps: [{
      n: 19,
      body: '§10 states the *need* (*“so HB Admins can follow up on past orders where the price was changed”*) but describes only the single-order view. Whether admins get a list, a filter, or a report is not specified. This story assumes the minimum that satisfies the stated need.',
    }],
  },

  {
    id: 'S-801', epic: 'E8', phase: 'Phase 2', sections: '§4, §11',
    title: 'Price against a stated buying frequency',
    role: 'seller',
    want: 'to see how often the buyer intends to reorder',
    soThat: 'I can price a recurring commitment differently from a one-off.',
    acs: [
      'Given frequency is released, when a buyer submits an RFQ, then frequency is captured alongside quantity.',
      'Given a request carries a frequency, when I open it, then the frequency is displayed with the quantity.',
      'Given frequency is captured, when I create a template (S-402), then the frequency is available as an input to that template.',
    ],
    depends: 'S-303, S-402. See Spec gap 8 on input type.',
    gaps: [],
  },
  {
    id: 'S-802', epic: 'E8', phase: 'Phase 2', sections: '§11',
    title: 'Special Credit (استمرارية / continuity)',
    role: 'buyer',
    want: 'continuity on an agreed special price',
    soThat: 'a negotiated relationship carries forward rather than resetting each order.',
    acs: [
      'Not yet defined. The draft names Special Credit as Phase 2 scope and gives no behaviour, no actor detail and no acceptance conditions.',
    ],
    gaps: [{
      n: 20,
      body: '**Placeholder only.** *“Special Credit (استمرارية / continuity)”* is a single line in §11. It is unclear whether this is a **credit facility** (payment terms), a **loyalty or continuity discount**, or another name for the template mechanism in S-402. **Do not estimate.** This story exists to hold the slot in the backlog, not to be groomed.',
    }],
  },
]

export interface Blocker { id: string; question: string; blocks: string; owner: string; gaps: number[] }

export const BLOCKERS: Blocker[] = [
  { id: 'B1', question: 'Is a request **per item** or **one request with many lines**?', blocks: 'E4, E5, E7 — all of them', owner: 'PM', gaps: [3] },
  { id: 'B2', question: 'What does the price negotiation returning to **Pending** mean, and does Reject end the negotiation or the order?', blocks: 'E5 entirely', owner: 'PM', gaps: [11, 12, 14] },
  { id: 'B3', question: 'What is a **template**: scope, expiry, quantity conditions, conflict rule, ownership?', blocks: 'S-402', owner: 'PM + Commercial', gaps: [9] },
  { id: 'B4', question: 'What happens when **invoice validation fails or is unavailable** — block, or flag and pass through? Interface contract and date?', blocks: 'E2', owner: 'Omar’s team + PM', gaps: [5] },
]

export const TRACEABILITY: { section: string; stories: string[]; note?: string }[] = [
  { section: '§1 Overview — two paths, direction of negotiation', stories: ['S-103', 'S-302'], note: 'The “stronger than a generic quote” framing drives S-204' },
  { section: '§2 Entry point — button, quantity', stories: ['S-101', 'S-102'] },
  { section: '§3 Case 1 — proof, disabled price input, AI validation', stories: ['S-201', 'S-202', 'S-203', 'S-204'], note: 'Validation is an external dependency' },
  { section: '§4 Case 2 — RFQ, frequency, combinable paths', stories: ['S-301', 'S-302', 'S-303', 'S-103'], note: 'Frequency deferred per the draft' },
  { section: '§5 Seller actions — Accept, template, Modify, Reject', stories: ['S-401', 'S-402', 'S-403', 'S-404'], note: 'Reject carries the circularity' },
  { section: '§6 Buyer actions — notify, compare, Accept/Reject', stories: ['S-501', 'S-502', 'S-503'] },
  { section: '§7 Order status — Pending, Cancel, open question', stories: ['S-503', 'S-504'], note: '§7’s open question = Spec gap 14' },
  { section: '§8 Notifications & Inbox — categories', stories: ['S-601', 'S-602', 'S-603', 'S-405'] },
  { section: '§9 Final Orders — indicator, log', stories: ['S-701', 'S-702'] },
  { section: '§10 Order page / admin visibility', stories: ['S-703', 'S-704'] },
  { section: '§11 Phase 2 — frequency, Special Credit', stories: ['S-801', 'S-802'], note: 'Special Credit is a placeholder' },
]

export const SLICING: { story: string; parts: string[] }[] = [
  { story: 'S-201', parts: ['Case 1 form + attachment control', 'disabled/enabled price-input behaviour', 'submission payload and validation rules'] },
  { story: 'S-202', parts: ['integration with the invoice-reading service', 'buyer-facing result states', 'seller-facing result display', 'failure and timeout handling'] },
  { story: 'S-402', parts: ['template data model and lifecycle', 'create/modify template UI', 'template application at pricing time'] },
  { story: 'S-702', parts: ['log event capture on every action', 'log view for buyer and seller', 'log view for HB Admin on the order page'] },
]

export const BUILD_ORDER = ['E1', 'E3', 'E4 (minus S-402)', 'E5', 'E6', 'E7', 'E2', 'S-402', 'E8']
