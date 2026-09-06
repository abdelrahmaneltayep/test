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
      releasedNote: 'Included in the releasable balance for this cycle.',
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
