;(function (root, factory) {
  const api = factory()
  root.HBSStrings = api
  if (typeof module !== 'undefined' && module.exports) module.exports = api
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  'use strict'

  /**
   * Every display string, in one object.
   *
   * The BRD asks for English matching the current product, and flags the seller-facing
   * labels as an open question (§12): the candidates noted were "Your Balance", "Your
   * Dues" and "My financial status". This build uses the first two as the names of
   * amounts and treats the third as the name of a screen, because it describes a place
   * rather than a figure. Keeping the strings here means an Arabic RTL pass is a change,
   * not a rewrite.
   */

  const fill = (tpl, vars) => tpl.replace(/\{(\w+)\}/g, (_, k) => (vars[k] === undefined ? '{' + k + '}' : vars[k]))

  return {
    fill,

    brand: 'Highbase',
    brandSub: 'Billing · statements',
    scope: {
      lead: 'Reporting only.',
      body: 'This module calculates and reports. It moves no money — Finance executes every transfer by hand, from these numbers.',
    },

    common: {
      export: 'Export',
      exportCsv: 'Export CSV',
      exportPdf: 'Print / PDF',
      period: 'Period',
      periods: { yearly: 'Yearly', monthly: 'Monthly', weekly: 'Weekly', order: 'Per order' },
      all: 'All',
      seller: 'Seller',
      buyer: 'Buyer',
      order: 'Order',
      date: 'Date',
      total: 'Total',
      openOrder: 'Open {id}',
      close: 'Close',
      designNotes: 'Design notes',
      loading: 'Loading',
      draft: 'Definition not yet agreed — see the open questions',
      notFound: 'Not found',
      notFoundNote: 'Nothing here matches that address.',
      empty: 'Nothing to show',
      backTo: '← {label}',
    },

    method: {
      hb_payment: 'HB Payment',
      cod: 'COD',
      hb_paymentNote: 'HB collected from the buyer, deducted its commission, and pays the remainder.',
      codNote: 'The courier handed the full amount to the seller. HB collected nothing, so its commission became a debt.',
    },

    picker: {
      title: 'HIGHBASE Billing — statements',
      lead: 'One calculation layer, three readers. Sellers see a cumulative ledger with a running balance; buyers see their orders standing on their own, with no commission anywhere; HB Admin sees both, plus what Finance has to pay and collect this cycle.',
      admin: 'HB Admin', adminNote: 'Every seller and buyer statement, the settlement cycle report, and the definitions still open.',
      seller: 'Seller', sellerNote: 'A running-balance ledger, the backdated COD debt, and the plan that prices it.',
      buyer: 'Buyer', buyerNote: 'Purchase orders, VAT and discounts. No commission — that is between HB and the seller.',
    },

    // The four amounts a seller reads. "Your Balance" and "Your Dues" are the BRD's own
    // candidate labels (§12), used verbatim.
    figures: {
      balance: 'Your Balance',
      balanceNote: 'What HB owes you, net of commission and fees, carried forward order over order.',
      dues: 'Your Dues',
      duesNote: 'Commission on COD orders, where you collected the cash and HB collected nothing.',
      paymentDue: 'HB Payment Due',
      paymentDueNote: 'What Finance transfers to you when this cycle runs.',
      sellerDue: 'Seller Due',
      sellerDueNote: 'What you remit to HB when this cycle runs, if netting has not cleared it.',
      recovered: 'Recovered by netting',
      recoveredNote: 'Backdated debt cleared against prepaid orders this period, without an invoice.',
    },

    seller: {
      statement: 'My statement',
      statementSub: 'Every order, with the balance carried forward',
      financialStatus: 'My financial status',
      dues: 'My dues',
      duesSub: 'Backdated COD commission, and what will clear it',
      plan: 'My plan',
      planSub: 'The rate that prices each order, and where it comes from',
      cumulative: 'This statement is cumulative: each order moves a balance that carries into the next.',
      noDebt: 'No backdated debt',
      noDebtNote: 'Every COD commission raised has been netted against a prepaid order.',
      debtHeading: 'Backdated COD commission outstanding',
      nettingTitle: 'How the debt clears',
      nettingNote: 'When a prepaid order arrives, HB deducts that order’s commission and any debt still outstanding, then releases the rest. A payout never goes below zero — what is left over waits for the next order.',
      notifyLabel: 'Tell the seller at the COD order',
      notifyOn: 'The debt appears the moment a COD order is delivered.',
      notifyOff: 'The debt appears only when the settlement cycle runs.',
      notifyOpen: 'The BRD leaves this open (§12). The switch shows both readings.',
    },

    admin: {
      sellers: 'Seller statements',
      sellersSub: 'Level 1 — every seller, with what HB owes and is owed',
      buyers: 'Buyer statements',
      buyersSub: 'Level 3 — purchase history per buyer',
      cycle: 'Settlement cycle',
      cycleSub: 'What Finance pays and collects — this module reports it, it does not run it',
      questions: 'Open questions',
      questionsSub: 'Where this build is standing on a definition the BRD has not settled',
      cycleWarn: 'Nothing here is executed. Every figure is an instruction to a person.',
      feeUnrecovered: 'Fixed fee could not be recovered from this cycle’s payout.',
    },

    buyer: {
      statement: 'My orders',
      statementSub: 'Each order stands on its own',
      notCumulative: 'This statement is not cumulative — there is no running account balance. Each order’s payment is tied to that order alone.',
      noCommission: 'Commission is a matter between HB and the seller. It does not appear on your statement and does not change what you pay.',
      paid: 'Paid',
      orderDetail: 'Order {id}',
    },

    columns: {
      orderDate: 'Order date',
      orderTotal: 'Order total',
      sellerReceivable: 'Seller receivable',
      hbReceivable: 'HB receivable',
      hbReceivableFull: 'HB receivable (incl. HB coupons)',
      commission: 'HB commission',
      fixedFees: 'HB fixed fees & subscriptions',
      deduction: 'HB deduction',
      netPayable: 'Net payables',
      hbTransaction: 'HB transaction',
      balance: 'Balance',
      paymentDue: 'HB payment due',
      sellerDue: 'Seller due',
      method: 'Method',
      rate: 'Rate',
      base: 'Pre-VAT base',
      vat: 'VAT',
      discount: 'Discount',
      offset: 'Netted',
      payout: 'Payout',
      outstanding: 'Outstanding after',
      status: 'Status',
      item: 'Item',
      qty: 'Qty',
      price: 'Price',
    },

    // The five definitions the BRD marks [Draft] (§8) plus the deduction column it says
    // does not exist yet. Shown on hover wherever the column appears.
    draftDefs: {
      netPayable: 'BRD §8 marks this [Draft]. Read here as one signed number: positive means HB owes the seller, negative means the seller owes HB.',
      hbTransaction: 'BRD §8 marks this [Draft]. Read here as what actually reaches HB’s account on this order — the commission it keeps out of money it collected.',
      balance: 'BRD §8 marks this [Draft]. Read here as the cumulative net position carried forward until the next settlement.',
      paymentDue: 'BRD §8 marks this [Draft]. Read here as the amount Finance transfers to the seller when the cycle runs.',
      sellerDue: 'BRD §8 marks this [Draft]. Read here as the amount the seller remits to HB when the cycle runs.',
      deduction: 'The BRD notes this has no column yet (§8, §12) and asks where it lives. Given one here: shipping, returns and penalties, itemised.',
      hbReceivable: 'The column name says "incl. HB coupons". Read here as netting — a coupon HB funded reduces what HB collects from the seller. The name reads the other way; it needs settling.',
    },

    calc: {
      title: 'How this order was calculated',
      base: 'Pre-VAT base',
      vatLine: 'VAT at {rate}',
      listTotal: 'Order total',
      discountHb: 'HB-funded discount',
      discountSeller: 'Seller-funded discount',
      buyerPaid: 'Buyer paid',
      commissionLine: 'HB commission at {rate} on the pre-VAT base',
      couponBack: 'HB-funded coupon, added back',
      deductionLine: 'HB deduction',
      receivable: 'Seller receivable',
      receivableCod: 'Seller collected directly',
      debtRaised: 'Booked as HB receivable',
      offsetLine: 'Prior debt netted',
      payoutLine: 'Released to the seller',
      droppedLine: '{n} line not charged commission',
      droppedLines: '{n} lines not charged commission',
      droppedNote: 'Rejected and cancelled items carry no commission (BRD §7.7), which is why this order’s commission is not a straight percentage of its listed total.',
      baseNote: 'Commission is charged on the pre-VAT base, whichever way the item price was entered.',
      // The same row on a buyer screen. A buyer has no commission, so explaining its base
      // to them is a seller-side note that wandered onto the wrong surface.
      baseNoteBuyer: 'The price before VAT. VAT is shown on its own line below.',
      couponNote: 'HB funded this coupon, so HB absorbs it. It is not deducted from the seller.',
      sellerDiscNote: 'The seller funded this discount. It reduces what he receives, not the commission base.',
    },
  }
})
