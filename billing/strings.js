/**
 * Every display string, in one object.
 *
 * Not because the prototype is bilingual — the UI is English, matching the current
 * Highbase product — but because an Arabic RTL pass should be a change to this file plus a
 * stylesheet, not a hunt through markup. Nothing outside this object writes a sentence a
 * user reads.
 */
;(function (root, factory) {
  const api = factory()
  root.HBStrings = api
  if (typeof module !== 'undefined' && module.exports) module.exports = api
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  'use strict'

  const S = {
    brand: 'Highbase',
    module: 'Billing',

    /*
     * "Your Balance" and "Your Dues" are the Highbase team's own words from the statement
     * margin, kept verbatim. A prototype that renames the thing the team already calls
     * something is a prototype they have to translate before they can review it.
     */
    states: {
      payable: 'Your Balance',
      held: 'Held',
      dues: 'Your Dues',
      awaiting: 'Awaiting buyer',
      awaitingGuarantor: 'Guaranteed — due',
      payableNote: 'Cash Highbase holds, net of commission and fees, released and ready to pay out.',
      heldNote: 'Cash Highbase holds but cannot yet release — delivery unconfirmed, return window open, or disputed.',
      duesNote: 'Commission and fees on orders where you collected the cash.',
      awaitingNote: 'Credit orders — delivered and invoiced, but not yet collected from anyone. Highbase does not guarantee these.',
      awaitingGuarantorNote: 'Credit orders Highbase has guaranteed. You are paid at delivery; Highbase carries the buyer’s risk.',
      heldEmpty: 'Nothing is held this cycle.',
      awaitingEmpty: 'No credit orders this cycle.',
      question: 'Where is the money?',
    },

    standing: {
      good: 'Good standing',
      watch: 'Under watch',
      late: 'Late',
      suspended: 'Credit suspended',
      title: 'Standing',
      detailTitle: 'What sets your standing',
      note: 'Your standing is derived from three ratios, recomputed every time the ledger moves. Nothing here is a score somebody assigned.',
      arrearsRatio: 'Dues against your ceiling',
      onlineShare: 'Share collected through Highbase',
      discountRatio: 'Funded discounts against commission earned',
      triggeredBy: 'What put you here',
      triggerAbove: '{label} is {value}, at or above the {threshold} limit.',
      triggerBelow: '{label} is {value}, below the {threshold} floor.',
      noTrigger: 'No ratio is near its limit.',
      toImprove: 'What would move you up',
      settle: 'Settle {amount} of dues to clear the arrears trigger.',
      route: 'Route {amount} more GMV through Highbase to clear the collection floor.',
      reduce: 'Funded discounts are running at {ratio} of commission earned. Below 1.00 clears it.',
      nothingToImprove: 'Nothing to clear — you are in good standing.',
    },

    risk: {
      label: 'Risk model',
      agent: 'Agent',
      guarantor: 'Guarantor',
      unresolved: 'Undecided',
      agentNote: 'Highbase does not guarantee credit orders. The seller waits for the buyer, and a credit order never enters a payout run.',
      guarantorNote: 'Highbase pays the seller at delivery and carries the buyer’s credit risk. Credit orders enter the run at delivery.',
      banner: 'Who carries the buyer’s credit risk has not been decided. This switch shows the same ledger as two different products — it is not a display option.',
    },

    nav: {
      wallet: 'Wallet', standing: 'Standing', ledger: 'Settlement ledger',
      runs: 'Payout runs', rateCard: 'My rate card',
      money: 'Money', account: 'Account',
      invoices: 'Invoices', statement: 'Statement', credit: 'Credit account',
      priceMatch: 'Price match', checkout: 'Checkout',
      reconciliation: 'Reconciliation', adjustments: 'Adjustments',
      rateCards: 'Rate cards', sellerExposure: 'Seller exposure', buyerExposure: 'Buyer exposure',
      control: 'Control', settlement: 'Settlement', exposure: 'Exposure',
    },

    personas: {
      title: 'Highbase Billing Module',
      lead: 'One ledger, three readers. The seller’s balance splits into four states, a payout is capped by the cash actually held, and a reconciliation control finds the mis-filed return that overstates the book by 291.000.',
      buyer: 'Buyer', buyerNote: 'Starts the cycle. Chooses the payment route and the terms — the heaviest decision in the module.',
      seller: 'Seller', sellerNote: 'Supplies, confirms delivery, settles dues. Never bears a discount he did not fund.',
      admin: 'Highbase admin', adminNote: 'Ops issues and corrects; Finance approves and pays. The separation is deliberate.',
    },

    wallet: {
      title: 'Wallet',
      cashPosition: 'Cash position',
      cashLine: 'Highbase holds {held} of your cash · kept {commission} commission · paid you {paid}',
      collectedLine: 'Collected on your behalf {collected} across {n} orders',
      nextPayout: 'Next payout', nextPayoutOn: 'Scheduled for {date}',
      recent: 'Recent movements',
      recentNote: 'The last movements on your account, newest first. Every row opens the order it came from.',
      viewLedger: 'View full ledger',
      unfundedWarn: 'Your book shows {book} but Highbase holds {cash} in cash for you. {gap} cannot be released until the funding lands.',
      duesExplain: '{amount} of commission sits on orders you collected yourself. Highbase has none of your cash to net it against, so it is recovered from a future payout or invoiced.',
      awaitingExplain: '{gross} is delivered and invoiced but not collected from anyone. Commission accrues when it is collected, so {net} is what would reach you.',
    },

    ledger: {
      title: 'Settlement ledger',
      note: 'Every movement on your account. Each row carries its posting type, the order it belongs to, the payment route, and the rate card that priced it.',
      filterType: 'Posting', filterRoute: 'Route', all: 'All',
      highbase: 'Highbase', seller: 'You', direct: 'Direct',
      empty: 'No movements match these filters.',
      emptyNote: 'Clear a filter to see the rest of the ledger.',
      colDate: 'Date', colType: 'Type', colOrder: 'Order', colRoute: 'Route',
      colTerms: 'Terms', colRate: 'Rate card', colAmount: 'Amount',
      runningTotal: 'Book balance',
      immediate: 'Immediate', credit: 'Credit',
    },

    lifecycle: {
      title: 'Order lifecycle',
      placed: 'Order placed',
      route: 'Payment route',
      routeKey: 'This is the fact that decides everything below it.',
      routeHighbase: 'Buyer pays Highbase. The cash lands on the platform, so commission nets against it automatically.',
      routeSeller: 'Buyer pays the seller directly. Highbase never touches this money, so the commission on it is a claim, not a deduction.',
      routeCredit: 'Buyer pays Highbase on credit terms, due {due}. Nobody has collected yet.',
      commission: 'Commission accrued',
      commissionOn: 'Charged on {base} at {rate}',
      commissionFunded: 'Charged on the gross {gross}, not the discounted {net} — the seller did not fund the discount, so is not charged for it.',
      commissionDeferred: 'Not yet accrued. Commission accrues on collection, not on delivery.',
      discount: 'Discount posted', discountNone: 'No discount on this order',
      discountFunded: 'Funded by Highbase. The seller is made whole for the full {amount}.',
      delivery: 'Delivery confirmed', deliveryPending: 'Delivery not confirmed',
      released: 'Released', reversed: 'Reversed', awaiting: 'Awaiting the buyer',
      settledDirect: 'Settled directly',
      releasedNote: 'Included in the releasable balance for this cycle.',
      settledDirectNote: 'You already hold this money — Highbase never received it, so there is nothing to release. The commission on it sits in Your Dues until it is netted against a future payout or invoiced.',
      reversedNote: 'A return reversed both the order value and the commission on it.',
      awaitingNote: 'Nothing is released until the buyer pays. In guarantor mode Highbase would have fronted this at delivery.',
      guaranteedNote: 'Highbase fronted this at delivery and carries the buyer’s risk.',
      buyerPaid: 'Buyer pays',
    },

    runs: {
      title: 'Payout runs',
      note: 'Each run releases what the payout rule allows, never more than the cash Highbase actually holds.',
      colRun: 'Run', colCycle: 'Cycle', colStatus: 'Status', colNet: 'Net released', colSeller: 'Seller',
      pending: 'Pending', paid: 'Paid', capped: 'Capped', refused: 'Refused',
      detailTitle: 'Payout run {id}',
      included: 'Orders in this run', carried: 'Carried over',
      carriedNone: 'Nothing is carried over. Every order in this cycle is settled or was collected by the seller.',
      computation: 'How the net was reached',
      grossCollected: 'Cash collected by Highbase',
      alreadyPaid: 'Already paid out this cycle',
      commissionNetted: 'Commission netted',
      discountsReimbursed: 'Funded discounts reimbursed',
      cashAvailable: 'Cash available to release',
      negativeAccruals: 'Negative accruals netted first',
      netRelease: 'Net release',
      cappedBy: 'Capped by the cash held — {gap} of the book balance cannot be released.',
      formula: 'payable = MAX(cashBacked + MIN(accrued, 0), 0)',
      refuse: 'Refuse this run', approve: 'Approve and pay',
      refusedNote: 'This run is refused, not merely flagged. Paying it short would settle one seller with another seller’s money.',
    },

    rateCard: {
      title: 'My rate card', applied: 'Applied to your orders',
      effective: 'Effective from {date}',
      appliedNote: 'Every posting in your ledger was priced with this card.',
      conflict: 'A different rate card is advertised',
      conflictNote: 'Subscription Settings shows {label}, effective {date}. Your ledger applies {applied}. Which of the two is contractual has not been settled.',
      stale: 'Stale',
      commissionThisCycle: 'Commission this cycle',
      onOrders: 'On {n} orders worth {value}',
    },

    admin: {
      ops: 'Ops', finance: 'Finance', actor: 'Signed in as', actorShort: 'Role',
      opsNote: 'Ops issues and corrects: rate cards, adjustments, price-match credits.',
      financeNote: 'Finance approves and pays: the reconciliation control, settlement runs, arrears invoicing.',
      separation: 'Two roles, not one. The same person cannot both write a credit and release the money for it — which is why the approve action changes with the role rather than being hidden from it.',
    },

    control: {
      title: 'Reconciliation control',
      note: 'One query over the whole book: does the commission charged equal the rate times the order value it was charged on?',
      query: 'sum(commission) === round3(rate × sum(orderValue))',
      passes: 'The book reconciles',
      fails: 'The book does not reconcile',
      passesNote: 'Commission charged matches the rate applied to order value, on every order in scope.',
      failsNote: 'Commission charged does not match the rate applied to order value. The offending rows are named below.',
      expected: 'Expected commission', actual: 'Commission charged', delta: 'Delta',
      offenders: 'Rows that do not reconcile',
      offendersNone: 'Every row reconciles.',
      offendersNoneNote: 'Nothing in the book charges commission that disagrees with its order value.',
      colSeller: 'Seller', colOrder: 'Order', colValue: 'Order value',
      anatomy: 'What this row actually did',
      anatomyNote: 'The control sees the commission leg. The balance moves by both legs, and the cash leg is the larger one by 1/rate — which is why an error of this shape is mostly invisible to a commission-only check.',
      cashLeg: 'Cash leg', commissionLeg: 'Commission leg', bothLegs: 'Effect on the stated balance',
      leverage: 'The cash error is {times}× the commission error — which is 1 ÷ {rate}, exactly.',
      oneDirectional: 'One-directional',
      oneDirectionalNote: 'A return filed as a sale always overstates what Highbase appears to owe. It never understates it: both legs move the balance the same way, so the errors accumulate rather than cancelling.',
      impact: 'What it costs',
      statedVsCorrect: 'Stated {stated} against a correct {correct}',
      scale: '{share} of the book · {times}× the commission earned on it',
      inScope: 'In scope',
      inScopeNote: '{n} orders. Credit orders awaiting collection are excluded from both sides — commission accrues on collection, and a control that cannot tell timing from error cries wolf every cycle.',
    },

    adjustments: {
      title: 'Adjustments queue',
      note: 'Returns, funded coupons and price-match credits, each with its funder, the order it belongs to, a reason and the evidence behind it.',
      colId: 'Adjustment', colType: 'Type', colOrder: 'Order', colSeller: 'Seller',
      colFunder: 'Funder', colAmount: 'Amount', colState: 'State', colEvidence: 'Evidence',
      return: 'Return', price_match_credit: 'Price-match credit', coupon: 'Funded coupon',
      posted: 'Posted', awaiting_approval: 'Awaiting approval', flagged: 'Flagged', approved: 'Approved',
      breakEven: 'Break-even',
      breakEvenNote: 'A credit routes for approval when the discount rate exceeds the commission rate. Past that point Highbase pays more to win the order than the order pays Highbase, so somebody signs for it.',
      overBreakEven: '{discount} discount against {commission} commission — Highbase nets {net} on this order.',
      underBreakEven: 'Below break-even. Posts without a signature.',
      approve: 'Approve', approveBlocked: 'Cannot approve',
      empty: 'Nothing in the queue.',
      emptyNote: 'No return, coupon or credit is outstanding on this book.',
    },

    rateCards: {
      title: 'Rate cards',
      note: 'Versioned, with effective dates. A card that is advertised but never applied is stale, and the prototype says so rather than resolving it.',
      colVersion: 'Version', colModel: 'Model', colRate: 'Rate', colEffective: 'Effective from',
      colStatus: 'Status', colSource: 'Source',
      applied: 'Applied', advertised: 'Advertised', stale: 'Stale',
      conflictTitle: 'Two live cards, one contract',
      conflictNote: 'The ledger prices every order at {applied}. Subscription Settings advertises {advertised} to sellers at signup. Both are current claims about the same agreement and they do not differ by a rounding.',
      unresolved: 'Which is contractual? — unresolved',
      unresolvedNote: 'Neither is applied silently. Resolving this is a commercial decision, not a data fix, and the prototype will not make it by defaulting.',
      worked: 'On Gulf Metal Supplies this cycle',
      workedApplied: '{label} charges {amount} across {n} orders.',
      workedAdvertised: '{label} would charge {amount} on the first order and nothing after it.',
    },

    exposure: {
      title: 'Seller exposure',
      note: 'What Highbase is owed, what it can recover by netting, and what it cannot.',
      colSeller: 'Seller', colMix: 'Collected through Highbase', colDues: 'Unsecured commission',
      colArrears: 'Arrears vs ceiling', colDiscount: 'Discount ratio', colStanding: 'Standing',
      colCash: 'Cash held',
      unsecuredTotal: 'Unsecured commission across the book',
      unsecuredNote: 'Commission earned on orders where the seller collected the cash. Highbase holds none of it and recovers it by netting a future payout, or by invoice.',
      alarm: 'Nothing to net against',
      alarmNote: 'Highbase has earned {dues} of commission on {name} and can collect none of it by netting, because it holds none of this seller’s cash. Every order was collected directly. This is the case the four-state model exists to surface.',
      buyerTitle: 'Buyer exposure',
      buyerNote: 'Highbase’s own outstanding against each buyer on guaranteed credit orders.',
      buyerAgentTitle: 'No buyer exposure in agent mode',
      buyerAgentNote: 'Highbase does not guarantee credit orders as an agent, so it carries no outstanding against any buyer. Switch the risk model to Guarantor to see what it would carry.',
      colBuyer: 'Buyer', colOutstanding: 'Outstanding', colLimit: 'Credit limit', colPolicy: 'Policy',
      overLimit: 'Over limit',
      policy: { ignore: 'Ignore', warn_only: 'Warn only', require_approval: 'Require approval', enforce_hold: 'Enforce hold' },
    },

    common: {
      order: 'Order', return: 'Return', close: 'Close',
      designNotes: 'Design notes', filing: 'Ledger',
      asFiled: 'As filed', corrected: 'Corrected',
      asFiledWarn: 'You are viewing the ledger as filed, including the RET-1007 sign error. Figures on this screen are overstated.',
      exampleData: 'Example data',
      loading: 'Loading', errorTitle: 'This did not load',
      errorNote: 'The ledger could not be read. Reload the page to try again.',
      notFound: 'Not found', notFoundNote: 'Nothing here matches that address.',
      gross: 'Gross', net: 'Net',
    },
  }

  /** The `awaiting` state is the one label the risk model changes. */
  S.stateLabel = function (state, risk) {
    if (state === 'awaiting') return risk === 'guarantor' ? S.states.awaitingGuarantor : S.states.awaiting
    return S.states[state]
  }
  S.stateNote = function (state, risk) {
    if (state === 'awaiting') return risk === 'guarantor' ? S.states.awaitingGuarantorNote : S.states.awaitingNote
    return S.states[state + 'Note']
  }

  /** Fill {placeholders}. Values arrive pre-formatted — no formatting happens here. */
  S.fill = function (template, params) {
    return String(template).replace(/\{(\w+)\}/g, (m, k) => (params && k in params ? params[k] : m))
  }

  return S
})
