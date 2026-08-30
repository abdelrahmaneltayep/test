/**
 * Feature Flow Draft — case coverage check.
 *
 * Walks the built prototype and asserts, in the browser, that each numbered case in
 * docs/HIGHBASE-Special-Price-RFQ-Feature-Flow-Draft.md is actually reachable and behaves
 * as the draft describes. It is deliberately end-to-end: the domain tests already prove the
 * rules, and what this adds is that a person can get to them.
 *
 *   npm run build && npx vite preview --port 4173 &
 *   node scripts/audit-draft-cases.mjs
 *
 * Exits non-zero if any case fails, so it can gate a change the way the unit tests do.
 */
import { chromium } from 'playwright'
const BROWSER = process.env.PLAYWRIGHT_CHROMIUM ?? undefined
const BASE = process.env.RFQ_URL ?? 'http://localhost:4173/rfq.html'
const b = await chromium.launch(BROWSER ? { executablePath: BROWSER } : {})
const p = await b.newPage({ viewport: { width: 1400, height: 1100 } })
const errors = []
p.on('pageerror', (e) => errors.push(String(e)))
const R = []
const check = (id, ok, detail) => R.push({ id, ok: !!ok, detail })
const txt = async (sel, i = 0) => (await p.locator(sel).nth(i).innerText().catch(() => '')).replace(/\n/g, ' | ')
const reset = async () => { await p.goto(BASE, { waitUntil: 'networkidle' }); await p.waitForTimeout(200) }

await reset()

// ── §2 entry point on the card, then quantity ────────────────────────────────
const cta = p.locator('.hb-prod', { hasText: 'Tomato Paste' }).getByRole('button', { name: /Request special price/ })
check('2.entry-on-card', await cta.count() === 1, await cta.innerText())
await cta.click(); await p.waitForTimeout(300)
check('2.quantity-field', await p.locator('.hb-modal-body .hb-field', { hasText: /Quantity/ }).count() === 1,
  (await p.locator('.hb-modal-body .hb-label').allInnerTexts()).join(' / '))

// ── §4 both routes offered together, per item ────────────────────────────────
const tabs = await p.locator('.hb-modal-body [role="tab"]').allInnerTexts()
check('4.both-routes-together', tabs.length === 2, tabs.map((t) => t.replace(/\n/g, ' ')).join(' | '))

// ── §3 proof mandatory: send with a price but no attachment ──────────────────
await p.locator('.hb-modal-body input[inputmode="numeric"]').first().fill('40')
await p.locator('.hb-modal-body input[inputmode="decimal"]').first().fill('8.100')
await p.getByRole('button', { name: 'Send request' }).click(); await p.waitForTimeout(250)
const blocked = await p.locator('.hb-overlay').count() === 1
const proofErr = await txt('.hb-modal-body .hb-error')
check('3.proof-mandatory', blocked && /document|attach|أرفق/i.test(await p.locator('.hb-modal-body').innerText()),
  `still open=${blocked} · ${proofErr}`)

// ── §3 AI/extraction check on the uploaded invoice ───────────────────────────
const supplierField = p.locator('.hb-modal-body label.hb-field', { hasText: /Supplier offering/ }).locator('input')
await supplierField.fill('Gulf Foods')
await p.locator('.hb-modal-body input[type="file"]').setInputFiles({
  name: 'gulf-foods-invoice.pdf', mimeType: 'application/pdf', buffer: Buffer.from('invoice'),
})
await p.waitForTimeout(400)
// The buyer sees the file and nothing else: extraction and its checks are the seller's
// evidence, and asserting their absence here is half of what makes that true.
check('3.buyer-sees-only-the-file', await p.locator('.hb-modal-body .hb-filechip').count() === 1
  && await p.locator('.hb-modal-body .hb-proof').count() === 0,
  await txt('.hb-modal-body .hb-filechip'))
await p.getByRole('button', { name: 'Send request' }).click(); await p.waitForTimeout(400)
const sentBody = await txt('.hb-overlay')
check('3.case1-sent', /Request sent/i.test(sentBody) && /SPR-\d{4}-\d{4}/.test(sentBody), sentBody)

// ── §4 RFQ: quantity + frequency, no price; frequency is Phase 2 ─────────────
await reset()
await p.locator('.hb-prod', { hasText: 'Tomato Paste' }).getByRole('button', { name: /Request special price/ }).click()
await p.waitForTimeout(300)
await p.locator('.hb-modal-body [role="tab"]').nth(1).click(); await p.waitForTimeout(200)
const rfqLabels = await p.locator('.hb-modal-body .hb-label').allInnerTexts()
check('4.rfq-no-price', !rfqLabels.some((l) => /target price/i.test(l)), rfqLabels.join(' / '))
check('4.rfq-frequency-p2', rfqLabels.some((l) => /how often/i.test(l)), rfqLabels.join(' / '))
await p.locator('.hb-modal-head button').click(); await p.waitForTimeout(150)

// ── §11 special credit: captured, shown, and Phase 2 under either reading ────
await p.locator('.hb-prod', { hasText: 'Tomato Paste' }).getByRole('button', { name: /Request special price/ }).click()
await p.waitForTimeout(300)
const creditField = p.locator('.hb-modal-body .hb-checkfield')
check('11.special-credit-offered', await creditField.count() === 1, await txt('.hb-modal-body .hb-checkfield'))
await creditField.locator('input').check()
await p.locator('.hb-modal-body input[inputmode="numeric"]').first().fill('40')
await p.locator('.hb-modal-body input[inputmode="decimal"]').first().fill('8.100')
await p.locator('.hb-modal-body label.hb-field', { hasText: /Supplier offering/ }).locator('input').fill('Gulf Foods')
await p.locator('.hb-modal-body input[type="file"]').setInputFiles({
  name: 'inv.pdf', mimeType: 'application/pdf', buffer: Buffer.from('x'),
})
await p.waitForTimeout(300)
await p.getByRole('button', { name: 'Send request' }).click(); await p.waitForTimeout(400)
const creditRef = (await txt('.hb-overlay')).match(/SPR-\d{4}-\d{4}/)?.[0] ?? ''
await p.locator('.hb-modal-head button').click(); await p.waitForTimeout(200)
await p.getByRole('button', { name: 'Seller · Dashboard' }).click(); await p.waitForTimeout(250)
await p.locator('tbody tr', { hasText: creditRef }).click(); await p.waitForTimeout(350)
// §3 — the invoice-reading result lands on the seller's page, where the decision is.
check('3.extraction-reaches-the-seller', await p.locator('.hb-proof').count() === 1
  && /Buyer typed/i.test(await txt('.hb-proof'))
  && /All automatic checks passed|Warn|Fail/i.test(await txt('.hb-proof')),
  (await txt('.hb-proof')).slice(0, 140))
const linePills = await p.locator('.hb-content .hb-pill').allInnerTexts()
check('11.special-credit-shown-to-seller', linePills.some((x) => /continuing arrangement/i.test(x)),
  `${creditRef} :: ${linePills.join(' | ')}`)
await p.getByRole('button', { name: /Back to the queue/ }).click(); await p.waitForTimeout(200)

// ── §11 / AC-3.3 — both release lines are walkable ───────────────────────────
async function formLabels(phaseBtn) {
  await reset()
  await p.getByRole('button', { name: phaseBtn }).click(); await p.waitForTimeout(200)
  await p.locator('.hb-prod', { hasText: 'Tomato Paste' }).getByRole('button', { name: /Request special price/ }).click()
  await p.waitForTimeout(300)
  const labels = await p.locator('.hb-modal-body .hb-label').allInnerTexts()
  const routes = await p.locator('.hb-modal-body [role="tab"]').count()
  const credit = await p.locator('.hb-modal-body .hb-checkfield').count()
  return { labels, routes, credit }
}

// The PRD's cut: Case 1 is [P2] (AC-3.3), frequency is captured from P1 (AC-5.2, Q-8).
const prd = await formLabels('P1 · PRD')
check('11.p1-prd-cut', prd.routes === 0 && !prd.labels.some((l) => /target price/i.test(l))
  && prd.labels.some((l) => /how often/i.test(l)) && prd.credit === 0,
  `routes=${prd.routes} credit=${prd.credit} · ${prd.labels.join(' / ')}`)

// The draft's cut: both routes ship (§1, §4), frequency waits — "quantity ships first".
const draft = await formLabels('P1 · draft')
await p.locator('.hb-modal-body [role="tab"]').nth(1).click(); await p.waitForTimeout(200)
const draftRfqLabels = await p.locator('.hb-modal-body .hb-label').allInnerTexts()
check('11.p1-draft-cut', draft.routes === 2 && draft.labels.some((l) => /target price/i.test(l))
  && !draftRfqLabels.some((l) => /how often/i.test(l)) && draft.credit === 0,
  `routes=${draft.routes} credit=${draft.credit} · case1: ${draft.labels.join(' / ')} · rfq: ${draftRfqLabels.join(' / ')}`)

// ── §2 one item per request ──────────────────────────────────────────────────
await reset()
await p.getByRole('button', { name: 'Buyer · Dashboard' }).click(); await p.waitForTimeout(250)
const buyerItems = await p.locator('tbody tr td:nth-child(4)').allInnerTexts()
check('2.one-item-buyer', buyerItems.every((x) => !/^\d+$/.test(x.trim())), buyerItems.map((x) => x.split('\n')[0]).join(' | '))

// ── §5 the seller's actions, on the route that carries them ──────────────────
//
// Price matching split this walk in two. The quote route still runs the draft's four
// moves; the match route is a guarantee and carries three, with no price input at all.
// The quote route: SPR-2608-0006 is a seeded RFQ awaiting the seller. The route is the
// page here, so the RFQ queue is where it lives.
await reset()
await p.getByRole('button', { name: 'Seller · Dashboard' }).click(); await p.waitForTimeout(250)
await p.locator('.hb-navitem', { hasText: 'RFQs' }).click(); await p.waitForTimeout(250)
const quoteRow = p.locator('tbody tr', { hasText: 'SPR-2608-0006' })
const rowActions = await quoteRow.locator('td:last-child button').allInnerTexts()
check('5.seller-accept-modify-reject', ['Counter', 'Decline'].every((x) => rowActions.includes(x))
  && rowActions.some((x) => /Accept|Match/.test(x)), rowActions.join(' | '))
await quoteRow.getByRole('button', { name: 'Counter' }).click()
await p.waitForTimeout(300)
check('5.detail-is-a-page', await p.locator('.hb-overlay').count() === 0
  && await p.locator('.hb-readback').count() === 1, `overlays=${await p.locator('.hb-overlay').count()}`)
const quoteActions = await p.locator('.hb-modal-foot button').allInnerTexts()
check('5.quote-route-keeps-the-loop', quoteActions.join('|') === 'Decline|Counter|Accept',
  quoteActions.join(' | '))
// Counter is gated on the price it needs.
const counterBtn = p.locator('.hb-modal-foot').getByRole('button', { name: 'Counter' })
check('5.counter-needs-price', await counterBtn.isDisabled(), await counterBtn.getAttribute('title') ?? '')
await p.locator('.hb-card-body input[inputmode="decimal"]').first().fill('1.800')
await p.waitForTimeout(250)
check('5.counter-enabled-with-price', !(await counterBtn.isDisabled()), 'typed 1.800')

// The match route: SPR-2608-0007 is a proved ask below the seller's floor.
await reset()
await p.getByRole('button', { name: 'Seller · Dashboard' }).click(); await p.waitForTimeout(250)
const matchRow = p.locator('tbody tr', { hasText: 'SPR-2608-0007' })
const matchRowActions = await matchRow.locator('td:last-child button').allInnerTexts()
check('pm.no-counter-in-the-row', !matchRowActions.some((x) => /Counter/i.test(x))
  && matchRowActions.some((x) => /Match/i.test(x)), matchRowActions.join(' | '))
// The row's own buttons settle the request from the queue, so the page is opened by
// clicking the row rather than a control.
await matchRow.click()
await p.waitForTimeout(350)
const readback = await txt('.hb-readback')
check('5.buyer-form-read-back', /Asking for/i.test(readback) && /Quantity/i.test(readback)
  && /Supplier offering/i.test(readback) && /Attachment/i.test(readback), readback.slice(0, 220))
// Three moves, and their order follows the verdict rather than a fixed layout: this
// fixture's document failed a check, so the ask leads and matching steps back.
const actions = await p.locator('.hb-modal-foot button').allInnerTexts()
check('pm.three-actions-on-a-match',
  actions.join('|') === 'Decline|Match this price|Request more info', actions.join(' | '))
// The three are not equals, and the button types say which is which. SPR-2608-0007's
// document fails a check, so the verdict promotes "ask for better evidence" and matching
// steps down — available, never disabled: a guarantee that hides its own button is not one.
const types = await p.locator('.hb-modal-foot button').evaluateAll((els) => els.map((e) => e.className
  .split(' ').find((c) => c.startsWith('hb-btn--')) ?? 'none'))
check('pm.ranking-follows-the-verdict',
  types.join('|') === 'hb-btn--danger|hb-btn--outline|hb-btn--primary'
  && !(await p.locator('.hb-modal-foot').getByRole('button', { name: 'Match this price' }).isDisabled()),
  types.join(' | '))
// The verification panel answers the question the page now asks, before the evidence below.
const verify = await txt('.hb-card', 1)
check('pm.verification-panel', /Verify this claim/i.test(verify) && /Their price/i.test(verify)
  && /Where matching leaves you/i.test(verify) && /Your floor/i.test(verify) && /Your cost/i.test(verify),
  verify.slice(0, 200))
// No price input at all: there is nothing on this page to counter with.
check('pm.no-price-input-on-a-match',
  await p.locator('.hb-card-body input[inputmode="decimal"]').count() === 0,
  'the counter field is not rendered on the match route')
// The guarantee is stated, not left to be inferred from a missing button.
const guarantee = await txt('.hb-banner--info')
check('pm.guarantee-is-stated', /verified price wins/i.test(guarantee), guarantee.slice(0, 160))
// Below floor: said in red at the point of commitment — the decision card, not the
// verdict banner further up, which is red for its own reason on this fixture.
const floorBanner = (await p.locator('.hb-card').last().locator('.hb-banner--bad').first()
  .innerText().catch(() => '')).replace(/\n/g, ' | ')
check('pm.below-floor-is-stated-not-blocking', /below your floor/i.test(floorBanner)
  && !(await p.locator('.hb-modal-foot').getByRole('button', { name: 'Match this price' }).isDisabled()),
  floorBanner.slice(0, 160))
// Order by order: matching settles this request and writes nothing forward.
await p.locator('.hb-modal-foot').getByRole('button', { name: 'Match this price' }).click()
await p.waitForTimeout(350)
check('5.no-template-offer', await p.locator('.hb-checkfield').count() === 0,
  'no save-forward choice rides on the match')
await p.locator('.hb-card .hb-tabs .hb-tab', { hasText: 'Sent' }).click(); await p.waitForTimeout(200)
const acceptedRow = await p.locator('tbody tr', { hasText: 'SPR-2608-0007' }).innerText()
check('5.accept-settles-once', /Accepted/i.test(acceptedRow) && !/Template/i.test(acceptedRow),
  acceptedRow.replace(/\n/g, ' | '))

// A clean claim: the verdict passes, so matching stays the default move.
await reset()
await p.getByRole('button', { name: 'Seller · Dashboard' }).click(); await p.waitForTimeout(250)
await p.locator('tbody tr', { hasText: 'SPR-2608-0001' }).click(); await p.waitForTimeout(400)
const cleanTypes = await p.locator('.hb-modal-foot button').evaluateAll((els) => els.map((e) => e.className
  .split(' ').find((c) => c.startsWith('hb-btn--')) ?? 'none'))
const cleanVerdict = await txt('.hb-card .hb-banner')
const cleanActions = await p.locator('.hb-modal-foot button').allInnerTexts()
check('pm.clean-claim-matches-by-default',
  cleanTypes.join('|') === 'hb-btn--quiet|hb-btn--danger|hb-btn--primary'
  && cleanActions.join('|') === 'Request more info|Decline|Match this price'
  && /passed every automatic check/i.test(cleanVerdict),
  `${cleanActions.join(' | ')} :: ${cleanTypes.join(' | ')} :: ${cleanVerdict.slice(0, 80)}`)

// ── A decline names its reason, and the buyer reads it ───────────────────────
await reset()
await p.getByRole('button', { name: 'Seller · Dashboard' }).click(); await p.waitForTimeout(250)
await p.locator('tbody tr', { hasText: 'SPR-2608-0007' })
  .getByRole('button', { name: 'Decline' }).click()
await p.waitForTimeout(300)
const declineSend = p.locator('.hb-modal-foot').getByRole('button', { name: 'Decline and reply' })
check('pm.decline-needs-a-reason', await declineSend.isDisabled(),
  'the send button is dead until a reason is chosen')
const reasonOptions = await p.locator('.hb-overlay select option').allInnerTexts()
check('pm.reason-is-a-controlled-list', reasonOptions.length >= 5
  && /Choose a reason/i.test(reasonOptions[0])
  && reasonOptions.some((x) => /could not be verified/i.test(x)), reasonOptions.join(' | '))
await p.locator('.hb-overlay select').first().selectOption({ label: 'Not a comparable offer (pack size, spec or terms)' })
await p.waitForTimeout(150)
check('pm.decline-enabled-once-named', !(await declineSend.isDisabled()), 'reason chosen')
await declineSend.click(); await p.waitForTimeout(350)
// The buyer is owed the answer, so they get the reason and not just the outcome.
await p.getByRole('button', { name: 'Buyer · Dashboard' }).click(); await p.waitForTimeout(300)
// A declined request is terminal, so it is on the Closed tab.
await p.locator('.hb-tab', { hasText: 'Closed' }).first().click(); await p.waitForTimeout(250)
await p.locator('tbody tr', { hasText: 'SPR-2608-0007' }).click(); await p.waitForTimeout(350)
const buyerDeclineText = await txt('.hb-content')
check('pm.buyer-reads-the-reason', /supplier declined this request/i.test(buyerDeclineText)
  && /comparable/i.test(buyerDeclineText), buyerDeclineText.slice(0, 200))

// ── §7 pending order: cancel and nothing else while the seller decides ───────
await reset()
await p.getByRole('button', { name: 'Buyer · Dashboard' }).click(); await p.waitForTimeout(250)
await p.locator('.hb-navitem', { hasText: 'Final Orders' }).click(); await p.waitForTimeout(250)
const pendingRow = p.locator('tbody tr', { hasText: 'SPR-2608-0001' })
await pendingRow.click(); await p.waitForTimeout(300)
const awaitBanner = await txt('.hb-overlay .hb-banner')
const awaitBtns = await p.locator('.hb-modal-foot button').allInnerTexts()
check('7.pending-cancel-only', /Waiting for the supplier/i.test(awaitBanner)
  && awaitBtns.length === 1 && /Cancel order/i.test(awaitBtns[0]), `${awaitBanner} :: ${awaitBtns.join(' | ')}`)
await p.locator('.hb-modal-head button').click(); await p.waitForTimeout(200)

// ── §6/§7 seller modified: accept or cancel, on the seller's number ──────────
const counteredRow = p.locator('tbody tr', { hasText: 'SPR-2608-0002' })
await counteredRow.click(); await p.waitForTimeout(300)
const modBanner = await txt('.hb-overlay .hb-banner')
const modBtns = await p.locator('.hb-modal-foot button').allInnerTexts()
check('6.modify-accept-or-cancel', /changed the price/i.test(modBanner) && modBtns.length === 2,
  `${modBanner} :: ${modBtns.join(' | ')}`)
const modTable = await txt('.hb-overlay table')
check('6.original-vs-offered', /Original price/i.test(modTable) && /Agreed price/i.test(modTable), modTable.slice(0, 160))
await p.locator('.hb-modal-head button').click(); await p.waitForTimeout(200)

// ── §5 MVP / §7 rejected: order back to Pending at the original price ────────
const rejectedRow = p.locator('tbody tr', { hasText: 'SPR-2607-0044' })
await rejectedRow.click(); await p.waitForTimeout(300)
const rejBanner = await txt('.hb-overlay .hb-banner')
const rejBtns = await p.locator('.hb-modal-foot button').allInnerTexts()
const rejStatus = await txt('.hb-overlay .hb-pill')
const rejRow = await txt('.hb-overlay tfoot')
check('5.reject-back-to-pending', /Pending/i.test(rejStatus) && /kept the original price/i.test(rejBanner)
  && rejBtns.length === 2, `${rejStatus} :: ${rejBanner} :: ${rejBtns.join(' | ')}`)
check('7.reject-original-price', /No change/i.test(rejRow), rejRow)

// ── §10 order page provenance, log, admin view ───────────────────────────────
const pills = await p.locator('.hb-overlay .hb-pill').allInnerTexts()
// The provenance pill now names the outcome rather than just the fact of a negotiation.
check('10.negotiation-and-invoice-flags',
  pills.some((x) => /Special price (accepted|rejected|under negotiation)/i.test(x))
  && pills.some((x) => /document/i.test(x)), pills.join(' | '))
const logCount = await p.locator('.hb-overlay .hb-log li').count()
check('9.full-log-on-order', logCount >= 2, `${logCount} entries`)
await p.getByRole('button', { name: 'HB Admin view' }).click(); await p.waitForTimeout(250)
const adminNote = await txt('.hb-overlay .hb-banner--info')
check('10.admin-view', /HIGHBASE administrators/i.test(adminNote), adminNote.slice(0, 120))
await p.locator('.hb-modal-head button').click(); await p.waitForTimeout(200)

// ── §6 seller accepted as-is: nothing asked of the buyer ─────────────────────
await p.locator('.hb-card .hb-tabs .hb-tab', { hasText: 'Final Orders' }).click(); await p.waitForTimeout(250)
const finalRow = p.locator('tbody tr', { hasText: 'SPR-2607-0031' })
await finalRow.click(); await p.waitForTimeout(300)
const finBtns = await p.locator('.hb-modal-foot button').allInnerTexts()
const finFoot = await txt('.hb-modal-foot')
check('6.accept-as-is-no-buyer-action', finBtns.length === 0 && /Nothing is needed from you/i.test(finFoot), finFoot)
const finTable = await txt('.hb-overlay tfoot')
check('9.old-vs-accepted-indicator', /Saved against list price/i.test(finTable) && /%/.test(finTable), finTable)
await p.locator('.hb-modal-head button').click(); await p.waitForTimeout(200)

// ── §9 standard orders sit in the same Final Orders list ─────────────────────
const finalRefs = await p.locator('tbody tr').allInnerTexts()
check('9.standard-plus-negotiated', finalRefs.some((r) => /Standard order/i.test(r))
  && finalRefs.some((r) => /Special price (accepted|rejected)/i.test(r)),
  finalRefs.map((r) => r.split('\n')[1]).join(' | '))

// ── §6 the buyer's request detail is a page, with the same ranked actions ────
//
// On the RFQ page, and only there. Price matching took the seller's counter off the match
// route, so "Counter received" is a state a buyer can now only reach by asking for a quote
// — the special-price page has no counters left to show, which is the guarantee seen from
// the other side.
await reset()
await p.getByRole('button', { name: 'Buyer · Dashboard' }).click(); await p.waitForTimeout(250)
check('pm.no-counters-on-the-match-page',
  !(await p.locator('tbody tr').allInnerTexts()).some((r) => /Counter received/i.test(r)),
  'the buyer never receives a counter on a proved ask')
await p.locator('.hb-navitem', { hasText: 'RFQs' }).click(); await p.waitForTimeout(250)
await p.locator('tbody tr', { hasText: 'Counter received' }).first()
  .getByRole('button', { name: 'Accept' }).click()
await p.waitForTimeout(350)
check('6.buyer-detail-is-a-page', await p.locator('.hb-overlay').count() === 0
  && await p.locator('.hb-readback').count() === 1,
  `overlays=${await p.locator('.hb-overlay').count()} readback=${await p.locator('.hb-readback').count()}`)
const buyerActions = await p.locator('.hb-modal-foot button').allInnerTexts()
const buyerTypes = await p.locator('.hb-modal-foot button').evaluateAll((els) => els.map((e) => e.className
  .split(' ').find((c) => c.startsWith('hb-btn--')) ?? 'none'))
// §6 — "Accept … or Reject … / Cancel". Two moves on the offer, and the withdraw that
// ends the request; no counter on this side.
check('6.buyer-two-moves-plus-withdraw', buyerActions.join('|') === 'Withdraw request|Decline|Accept'
  && buyerTypes.join('|') === 'hb-btn--quiet|hb-btn--danger|hb-btn--primary',
  `${buyerActions.join(' | ')} :: ${buyerTypes.join(' | ')}`)
// "Counter received" and "Counter-offered" still describe what the supplier did; what is
// gone is any control that lets the buyer make one.
const buyerControls = [
  ...await p.locator('.hb-content button').allInnerTexts(),
  ...await p.locator('.hb-content .hb-label').allInnerTexts(),
]
check('6.no-buyer-counter', !buyerControls.some((x) => /counter/i.test(x))
  && await p.locator('.hb-content input[inputmode="decimal"]').count() === 0,
  buyerControls.join(' | ').slice(0, 120))
check('6.no-history-tab-on-request', await p.locator('.hb-content > .hb-tabs').count() === 0,
  'the log is on the order, per §9 and §10')
const buyerCompare = await txt('.hb-content table')
check('6.buyer-three-prices', /Original/i.test(buyerCompare) && /You asked/i.test(buyerCompare)
  && /Supplier offers/i.test(buyerCompare), buyerCompare.slice(0, 160))

// ── §5/§9 Final Orders name the outcome, for both roles ──────────────────────
for (const [surface, who] of [['Buyer · Dashboard', 'buyer'], ['Seller · Dashboard', 'seller']]) {
  await reset()
  await p.getByRole('button', { name: surface }).click(); await p.waitForTimeout(250)
  await p.locator('.hb-navitem', { hasText: 'Final Orders' }).click(); await p.waitForTimeout(250)
  await p.locator('.hb-card .hb-tabs .hb-tab', { hasText: 'Final Orders' }).click(); await p.waitForTimeout(220)
  const rows = await p.locator('tbody tr').allInnerTexts()
  const flat = rows.join(' | ')
  check(`9.final-orders-outcomes-${who}`,
    /Special price accepted/i.test(flat) && /Special price rejected/i.test(flat)
    && /Standard order/i.test(flat),
    rows.map((r) => r.split('\n')[1]).join(' · '))
}
// The rejected one is final at the original price: bought, but at no saving.
const rejectedFinal = p.locator('tbody tr', { hasText: 'Special price rejected' })
await rejectedFinal.click(); await p.waitForTimeout(300)
const rejPills = await p.locator('.hb-overlay .hb-pill').allInnerTexts()
const rejFoot = await txt('.hb-overlay tfoot')
check('9.rejected-final-at-original', rejPills.some((x) => /Special price rejected/i.test(x))
  && /No change/i.test(rejFoot), `${rejPills.join(' | ')} :: ${rejFoot}`)
await p.locator('.hb-modal-head button').click(); await p.waitForTimeout(200)
await p.locator('tbody tr', { hasText: 'Special price accepted' }).first().click(); await p.waitForTimeout(300)
const accPills = await p.locator('.hb-overlay .hb-pill').allInnerTexts()
check('9.accepted-final-shows-saving', accPills.some((x) => /Special price accepted/i.test(x))
  && /%/.test(await txt('.hb-overlay tfoot')), accPills.join(' | '))
await p.locator('.hb-modal-head button').click(); await p.waitForTimeout(200)

// ── §8 Inbox, three categories, both roles ───────────────────────────────────
for (const [surface, who] of [['Buyer · Dashboard', 'buyer'], ['Seller · Dashboard', 'seller']]) {
  await p.getByRole('button', { name: surface }).click(); await p.waitForTimeout(250)
  await p.locator('.hb-navitem', { hasText: 'Inbox' }).click(); await p.waitForTimeout(250)
  const cats = (await p.locator('.hb-card .hb-tabs .hb-tab').allInnerTexts()).map((x) => x.replace(/\n/g, ' '))
  const rows = await p.locator('.hb-inbox-item').count()
  const outcomes = await p.locator('.hb-inbox-item .hb-pill').allInnerTexts()
  check(`8.inbox-${who}`, cats.length === 3 && /Special Price Request/i.test(cats[0])
    && /RFQ/i.test(cats[1]) && /Sent/i.test(cats[2]) && rows > 0,
    `${cats.join(' | ')} · ${rows} rows · ${[...new Set(outcomes)].join(',')}`)
}

await b.close()

const failed = R.filter((r) => !r.ok)
for (const r of R) console.log(`${r.ok ? 'ok  ' : 'FAIL'}  ${r.id.padEnd(34)} ${r.detail}`)
if (errors.length) console.log('\npage errors:', errors)
console.log(`\n${R.length} cases checked, ${failed.length} failing, ${errors.length} page errors`)
process.exit(failed.length || errors.length ? 1 : 0)
