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
// A local prototype answers in milliseconds; eight seconds is already a hang, and the
// 30s default turned one bad selector into a run nobody waited out.
p.setDefaultTimeout(8000)
// Top-level await means a throw escapes as an unhandled rejection; catching it here is
// what lets the results collected so far still reach the console.
process.on('uncaughtException', (e) => { console.log(`\nWALK STOPPED: ${e.message.split('\n')[0]}`); report(); })
process.on('unhandledRejection', (e) => { console.log(`\nWALK STOPPED: ${String(e).split('\n')[0]}`); report(); })
const errors = []
p.on('pageerror', (e) => errors.push(String(e)))
const R = []
const check = (id, ok, detail) => R.push({ id, ok: !!ok, detail })
const txt = async (sel, i = 0) => (await p.locator(sel).nth(i).innerText().catch(() => '')).replace(/\n/g, ' | ')
// The load itself keeps a long leash — the page pulls webfonts, and a slow network there
// is not a failing case.
const reset = async () => { await p.goto(BASE, { waitUntil: 'networkidle', timeout: 45000 }); await p.waitForTimeout(200) }

await reset()

// ── §2 entry point on the card, then quantity ────────────────────────────────
const cta = p.locator('.hb-prod', { hasText: 'Tomato Paste' }).getByRole('button', { name: /Match my price/ })
check('2.entry-on-card', await cta.count() === 1, await cta.innerText())

// ── The price-matching card note: the button, the icon, and what it promises ──
const tipBtn = p.locator('.hb-prod', { hasText: 'Tomato Paste' }).locator('.hb-tip-btn')
check('pm.card-names-the-action', /Match my price/i.test(await cta.innerText())
  && await tipBtn.count() === 1, await cta.innerText())
await tipBtn.click(); await p.waitForTimeout(220)
const tipText = await txt('.hb-prod .hb-tip-panel')
check('pm.incentive-tooltip', /Found a lower price elsewhere/i.test(tipText)
  && /5% or 10%/.test(tipText) && /HIGHBASE/.test(tipText), tipText.slice(0, 160))
// A tooltip nobody can dismiss from the keyboard is not a disclosure.
await p.keyboard.press('Escape'); await p.waitForTimeout(200)
check('pm.tooltip-dismissible', await p.locator('.hb-prod .hb-tip-panel').count() === 0,
  'Escape closes it')
// The icon explains why to start, so it goes once a request is already open.
check('pm.no-tooltip-once-requested',
  await p.locator('.hb-prod', { hasText: 'Almarai' }).locator('.hb-tip-btn').count() === 0,
  'the card with a live request carries no incentive icon')
// The after state is a status, and it says whose turn it is rather than only that an
// ask was made. Almarai is with the supplier; Sunflower has been answered.
const withSupplier = await txt('.hb-prod:has-text("Almarai") .hb-prod-state')
const answered = await txt('.hb-prod:has-text("Sunflower") .hb-prod-state')
check('pm.after-state-is-a-status', /Match requested/i.test(withSupplier)
  && /SPR-\d{4}-\d{4}/.test(withSupplier), withSupplier)
check('pm.after-state-turns-to-the-buyer', /Your answer needed/i.test(answered), answered)
// Route-aware: a quote request is not a match request.
check('pm.after-state-names-the-route',
  /Quote requested/i.test(await txt('.hb-prod:has-text("Bottled Water") .hb-prod-state')),
  await txt('.hb-prod:has-text("Bottled Water") .hb-prod-state'))
// The price ladder stays whole in the layout that puts the action beside the price.
await p.getByRole('button', { name: 'beside the price', exact: true }).click(); await p.waitForTimeout(300)
check('pm.after-state-keeps-the-ladder-whole',
  await p.locator('.hb-prod', { hasText: 'Almarai' }).evaluate((c) => {
    const bands = [...c.querySelectorAll('.hb-priceband')]
    const tag = c.querySelector('.hb-prod-state')
    return bands.length >= 2 && !!tag
      && tag.getBoundingClientRect().top > bands[1].getBoundingClientRect().top
  }), 'the status sits below the ladder, not inside it')
await p.getByRole('button', { name: 'full label', exact: true }).click(); await p.waitForTimeout(300)
await cta.click(); await p.waitForTimeout(300)
check('2.quantity-field', await p.locator('.hb-modal-body .hb-field', { hasText: /Quantity/ }).count() === 1,
  (await p.locator('.hb-modal-body .hb-label').allInnerTexts()).join(' / '))

// ── §4 both routes offered together, per item ────────────────────────────────
// Not as tabs any more: the card sends the buyer here to match, and the quote is the way
// out for someone with no invoice. One press away, one line of the form.
const switchLink = await txt('.hb-routeswitch')
check('4.both-routes-together', /quote instead/i.test(switchLink), switchLink)

// ── §3 proof mandatory: send with a price but no attachment ──────────────────
await p.locator('.hb-modal-body input[inputmode="numeric"]').first().fill('40')
await p.locator('.hb-modal-body input[inputmode="decimal"]').first().fill('8.100')
await p.getByRole('button', { name: 'Match price' }).click(); await p.waitForTimeout(250)
const blocked = await p.locator('.hb-overlay').count() === 1
const proofErr = await txt('.hb-modal-body .hb-error')
check('3.proof-mandatory', blocked && /document|attach|أرفق/i.test(await p.locator('.hb-modal-body').innerText()),
  `still open=${blocked} · ${proofErr}`)

// One drop zone, and no `capture` on it: without it the phone's own sheet offers Take
// Photo and Photo Library together, and it is `capture` that makes some browsers drop the
// library — stranding a buyer who already has the invoice saved.
const zone = await txt('.hb-dropzone')
const zoneInput = await p.locator('.hb-dropzone input').evaluate(
  (e) => `${e.getAttribute('accept')}|${e.getAttribute('capture') ?? 'none'}`)
check('pm.camera-or-file', /Upload file/i.test(zone) && /camera or gallery/i.test(zone)
  && zoneInput.endsWith('none') && zoneInput.includes('image/*'),
  `${zone} :: ${zoneInput}`)
// The card promised 5–10%; the form discloses it as a term, at the foot, before Send —
// a disclaimer and not an info icon, which is what the voice note asks for.
const formIncentive = await txt('.hb-modal-body .hb-disclaimer')
check('pm.incentive-disclosed-at-the-foot', /5–10%/.test(formIncentive)
  && /HIGHBASE team/i.test(formIncentive)
  && await p.locator('.hb-modal-body .hb-disclaimer .hb-tip-btn').count() === 0,
  formIncentive.slice(0, 160))

// ── §3 AI/extraction check on the uploaded invoice ───────────────────────────
// The buyer no longer types the supplier; extraction reads it off the file.
await p.locator('.hb-modal-body .hb-dropzone input[type="file"]').setInputFiles({
  name: 'gulf-foods-invoice.pdf', mimeType: 'application/pdf', buffer: Buffer.from('invoice'),
})
await p.waitForTimeout(400)
// The buyer sees the file and nothing else: extraction and its checks are the seller's
// evidence, and asserting their absence here is half of what makes that true.
check('3.buyer-sees-only-the-file', await p.locator('.hb-modal-body .hb-filechip').count() === 1
  && await p.locator('.hb-modal-body .hb-proof').count() === 0,
  await txt('.hb-modal-body .hb-filechip'))
await p.getByRole('button', { name: 'Match price' }).click(); await p.waitForTimeout(400)
const sentBody = await txt('.hb-overlay')
check('3.case1-sent', /Request sent/i.test(sentBody) && /SPR-\d{4}-\d{4}/.test(sentBody), sentBody)

// ── §4 RFQ: quantity + frequency, no price; frequency is Phase 2 ─────────────
await reset()
await p.locator('.hb-prod', { hasText: 'Tomato Paste' }).getByRole('button', { name: /Match my price/ }).click()
await p.waitForTimeout(300)
await p.locator('.hb-routeswitch').click(); await p.waitForTimeout(250)
const rfqLabels = await p.locator('.hb-modal-body .hb-label').allInnerTexts()
check('4.rfq-no-price', !rfqLabels.some((l) => /target price/i.test(l)), rfqLabels.join(' / '))
check('4.rfq-frequency-p2', rfqLabels.some((l) => /how often/i.test(l)), rfqLabels.join(' / '))
await p.locator('.hb-modal-head button').click(); await p.waitForTimeout(150)

// ── §3 extraction, then §11 special credit — two walks, each from a clean load.
//    They cannot share one: the match form stopped carrying special credit when the card
//    design cut it to three questions, and one product can hold only one open request.

// The match route carries the document, so extraction is walked on its own request.
await p.locator('.hb-prod', { hasText: 'Tomato Paste' }).getByRole('button', { name: /Match my price/ }).click()
await p.waitForTimeout(300)
await p.locator('.hb-modal-body input[inputmode="numeric"]').first().fill('40')
await p.locator('.hb-modal-body input[inputmode="decimal"]').first().fill('8.100')
await p.locator('.hb-modal-body .hb-dropzone input[type="file"]').setInputFiles({
  name: 'gulf-foods-inv.pdf', mimeType: 'application/pdf', buffer: Buffer.from('x'),
})
await p.waitForTimeout(300)
await p.getByRole('button', { name: 'Match price' }).click(); await p.waitForTimeout(400)
const proofRef = (await txt('.hb-overlay')).match(/SPR-\d{4}-\d{4}/)?.[0] ?? ''
await p.locator('.hb-modal-head button').click(); await p.waitForTimeout(200)
await p.getByRole('button', { name: 'Seller · Dashboard' }).click(); await p.waitForTimeout(250)
await p.locator('tbody tr', { hasText: proofRef }).click(); await p.waitForTimeout(350)
// §3 — the invoice-reading result lands on the seller's page, where the decision is.
check('3.extraction-reaches-the-seller', await p.locator('.hb-proof').count() === 1
  && /Buyer typed/i.test(await txt('.hb-proof'))
  && /All automatic checks passed|Warn|Fail/i.test(await txt('.hb-proof')),
  (await txt('.hb-proof')).slice(0, 140))
// The buyer stopped typing the supplier, so the seller reads it off the document — and
// the page says which of the two columns it came from.
const readback0 = await txt('.hb-readback')
check('pm.supplier-read-from-the-document',
  /Gulf Foods/i.test(readback0) && /Read from the document/i.test(readback0),
  readback0.slice(0, 220))

// Special credit rides the quote route now, where the buyer describes an arrangement.
await reset()
await p.locator('.hb-prod', { hasText: 'Tomato Paste' }).getByRole('button', { name: /Match my price/ }).click()
await p.waitForTimeout(300)
await p.locator('.hb-routeswitch').click(); await p.waitForTimeout(250)
const creditField = p.locator('.hb-modal-body .hb-checkfield')
check('11.special-credit-offered', await creditField.count() === 1, await txt('.hb-modal-body .hb-checkfield'))
await creditField.locator('input').check()
await p.locator('.hb-modal-body input[inputmode="numeric"]').first().fill('40')
await p.getByRole('button', { name: 'Send request' }).click(); await p.waitForTimeout(400)
const creditRef = (await txt('.hb-overlay')).match(/SPR-\d{4}-\d{4}/)?.[0] ?? ''
await p.locator('.hb-modal-head button').click(); await p.waitForTimeout(200)
await p.getByRole('button', { name: 'Seller · Dashboard' }).click(); await p.waitForTimeout(250)
await p.locator('.hb-navitem', { hasText: 'RFQs' }).click(); await p.waitForTimeout(300)
await p.locator('tbody tr', { hasText: creditRef }).click(); await p.waitForTimeout(350)
const linePills = await p.locator('.hb-content .hb-pill').allInnerTexts()
check('11.special-credit-shown-to-seller', linePills.some((x) => /continuing arrangement/i.test(x)),
  `${creditRef} :: ${linePills.join(' | ')}`)
await p.getByRole('button', { name: /Back to the queue/ }).click(); await p.waitForTimeout(200)

// ── Error cases: every refusal names itself ──────────────────────────────────
await reset()
await p.locator('.hb-prod', { hasText: 'Tomato Paste' }).getByRole('button', { name: /Match my price/ }).click()
await p.waitForTimeout(350)
const fieldErrors = async () =>
  (await p.locator('.hb-modal-body .hb-error, .hb-modal-body .hb-warning').allInnerTexts()).join(' | ')

await p.getByRole('button', { name: 'Match price' }).click(); await p.waitForTimeout(250)
const empty = await fieldErrors()
check('err.empty-form-names-every-field', /Enter the quantity/i.test(empty)
  && /Enter your requested price/i.test(empty) && /Attach the document/i.test(empty), empty.slice(0, 160))

await p.locator('.hb-modal-body input[inputmode="numeric"]').first().fill('2'); await p.waitForTimeout(200)
check('err.below-minimum-quantity', /minimum order quantity is 10 cartons/i.test(await fieldErrors()), await fieldErrors())

await p.locator('.hb-modal-body input[inputmode="numeric"]').first().fill('40')
await p.locator('.hb-modal-body input[inputmode="decimal"]').first().fill('99.000'); await p.waitForTimeout(200)
check('err.target-at-or-above-list', /lower than the current price/i.test(await fieldErrors()), await fieldErrors())

// EC-8 — implausible is a warning, never a block: it still sends, flagged.
await p.locator('.hb-modal-body input[inputmode="decimal"]').first().fill('1.000'); await p.waitForTimeout(200)
check('err.implausible-warns-not-blocks', /significantly lower/i.test(await fieldErrors())
  && !(await p.locator('.hb-modal-foot .hb-btn--primary').isDisabled()), await fieldErrors())

await p.locator('.hb-modal-body input[inputmode="decimal"]').first().fill('8.100')
await p.locator('.hb-modal-body .hb-dropzone input[type="file"]').setInputFiles(
  { name: 'big.pdf', mimeType: 'application/pdf', buffer: Buffer.alloc(11 * 1024 * 1024) })
await p.waitForTimeout(300)
// The rejection has to beat the absence: both are true, only one is news.
check('err.file-too-large', /maximum allowed size of 10 MB/i.test(await fieldErrors()), await fieldErrors())
await p.locator('.hb-modal-body .hb-dropzone input[type="file"]').setInputFiles(
  { name: 'notes.txt', mimeType: 'text/plain', buffer: Buffer.from('x') })
await p.waitForTimeout(300)
check('err.wrong-file-type', /file type is not supported/i.test(await fieldErrors()), await fieldErrors())

// FR-2.6 — the cooldown, walked rather than seeded: send, decline, come back to the card.
await reset()
await p.locator('.hb-prod', { hasText: 'Tomato Paste' }).getByRole('button', { name: /Match my price/ }).click()
await p.waitForTimeout(350)
await p.locator('.hb-modal-body input[inputmode="numeric"]').first().fill('40')
await p.locator('.hb-modal-body input[inputmode="decimal"]').first().fill('8.100')
await p.locator('.hb-modal-body .hb-dropzone input[type="file"]').setInputFiles(
  { name: 'gulf-foods-inv.pdf', mimeType: 'application/pdf', buffer: Buffer.from('x') })
await p.waitForTimeout(300)
await p.getByRole('button', { name: 'Match price' }).click(); await p.waitForTimeout(400)
const gateRef = (await txt('.hb-overlay')).match(/SPR-\d{4}-\d{4}/)?.[0] ?? ''
await p.locator('.hb-modal-head button').click(); await p.waitForTimeout(200)
await p.getByRole('button', { name: 'Seller · Dashboard' }).click(); await p.waitForTimeout(300)
await p.locator('tbody tr', { hasText: gateRef }).click(); await p.waitForTimeout(400)
await p.getByRole('button', { name: 'Decline', exact: true }).click(); await p.waitForTimeout(300)
await p.locator('.hb-overlay select').first().selectOption({ index: 3 }); await p.waitForTimeout(150)
await p.getByRole('button', { name: 'Decline and reply' }).click(); await p.waitForTimeout(400)
await p.getByRole('button', { name: 'Buyer · Marketplace' }).click(); await p.waitForTimeout(400)
const gatedCta = p.locator('.hb-prod', { hasText: 'Tomato Paste' }).locator('.hb-btn--outline')
check('err.cooldown-after-a-decision', await gatedCta.isDisabled()
  && /Ask again/i.test(await gatedCta.innerText())
  && /order it now at list price/i.test(await txt('.hb-prod:has-text("Tomato Paste") .hb-prod-gate')),
  await txt('.hb-prod:has-text("Tomato Paste") .hb-prod-gate'))

// A rule can settle a request in the step that created it, and the confirmation says so
// rather than promising a reply that is never coming.
await reset()
await p.getByRole('button', { name: '10%', exact: true }).click(); await p.waitForTimeout(250)
await p.locator('.hb-prod', { hasText: 'Tomato Paste' }).getByRole('button', { name: /Match my price/ }).click()
await p.waitForTimeout(350)
await p.locator('.hb-modal-body input[inputmode="numeric"]').first().fill('40')
await p.locator('.hb-modal-body input[inputmode="decimal"]').first().fill('8.500')
await p.locator('.hb-modal-body .hb-dropzone input[type="file"]').setInputFiles(
  { name: 'inv.pdf', mimeType: 'application/pdf', buffer: Buffer.from('x') })
await p.waitForTimeout(300)
await p.getByRole('button', { name: 'Match price' }).click(); await p.waitForTimeout(400)
check('err.auto-resolved-is-told-truthfully',
  /Price matched/i.test(await p.locator('.hb-overlay h2').innerText())
  && /no waiting/i.test(await txt('.hb-overlay .hb-banner'))
  && !/within 24 hours/i.test(await txt('.hb-overlay .hb-banner')),
  `${await p.locator('.hb-overlay h2').innerText()} :: ${(await txt('.hb-overlay .hb-banner')).slice(0, 90)}`)

// ── §11 / AC-3.3 — both release lines are walkable ───────────────────────────
async function formLabels(phaseBtn) {
  await reset()
  await p.getByRole('button', { name: phaseBtn }).click(); await p.waitForTimeout(200)
  await p.locator('.hb-prod', { hasText: 'Tomato Paste' }).getByRole('button', { name: /Match my price/ }).click()
  await p.waitForTimeout(300)
  const labels = await p.locator('.hb-modal-body .hb-label').allInnerTexts()
  // The second route is a link now, not a tab: present or absent, never two of them.
  const routes = await p.locator('.hb-routeswitch').count()
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
await p.locator('.hb-routeswitch').click(); await p.waitForTimeout(250)
const draftRfqLabels = await p.locator('.hb-modal-body .hb-label').allInnerTexts()
check('11.p1-draft-cut', draft.routes === 1 && draft.labels.some((l) => /target price/i.test(l))
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
  pills.some((x) => /Price (matched|negotiated|declined|under negotiation)/i.test(x))
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
  && finalRefs.some((r) => /Price (matched|negotiated|declined)/i.test(r)),
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
    /Price (matched|negotiated)/i.test(flat) && /Price declined/i.test(flat)
    && /Standard order/i.test(flat),
    rows.map((r) => r.split('\n')[1]).join(' · '))
}
// The rejected one is final at the original price: bought, but at no saving.
const rejectedFinal = p.locator('tbody tr', { hasText: 'Price declined' })
await rejectedFinal.click(); await p.waitForTimeout(300)
const rejPills = await p.locator('.hb-overlay .hb-pill').allInnerTexts()
const rejFoot = await txt('.hb-overlay tfoot')
check('9.rejected-final-at-original', rejPills.some((x) => /Price declined/i.test(x))
  && /No change/i.test(rejFoot), `${rejPills.join(' | ')} :: ${rejFoot}`)
await p.locator('.hb-modal-head button').click(); await p.waitForTimeout(200)
await p.locator('tbody tr', { hasText: /Price (matched|negotiated)/ }).first().click(); await p.waitForTimeout(300)
const accPills = await p.locator('.hb-overlay .hb-pill').allInnerTexts()
check('9.accepted-final-shows-saving', accPills.some((x) => /Price (matched|negotiated)/i.test(x))
  && /%/.test(await txt('.hb-overlay tfoot')), accPills.join(' | '))
await p.locator('.hb-modal-head button').click(); await p.waitForTimeout(200)

// ── §10 HB Admin — the surface the draft asks for by name ────────────────────
await reset()
await p.getByRole('button', { name: 'HB Admin' }).click(); await p.waitForTimeout(400)
const adminNotice = await txt('.hb-content .hb-banner--info')
check('10.admin-is-read-only', /read-only/i.test(adminNotice) && /cannot change/i.test(adminNotice),
  adminNotice.slice(0, 140))
const stats = await p.locator('.hb-stat').allInnerTexts()
check('10.admin-counts-the-negotiated', stats.length === 4
  && stats.some((x) => /Negotiated orders/i.test(x)) && stats.some((x) => /price moved/i.test(x)),
  stats.map((x) => x.replace(/\n/g, ' ')).join(' | '))
// Declines carry a reason now, so the follow-up surface can group by it.
const reasons = await txt('.hb-card')
check('10.admin-groups-declines-by-reason', /Why suppliers declined/i.test(reasons)
  && /Reason given/i.test(reasons), reasons.slice(0, 160))

await p.locator('.hb-navitem', { hasText: 'Negotiated orders' }).click(); await p.waitForTimeout(400)
const adminCols = await p.locator('thead th').allInnerTexts()
check('10.admin-audit-columns', ['Buyer · Supplier', 'Type', 'Outcome', 'Order total', 'Change', 'Proof']
  .every((c) => adminCols.includes(c)), adminCols.join(' | '))
const allRows = await p.locator('tbody tr').count()
// §10 — the full log, opened on the order, without losing the table it was found in.
await p.locator('tbody tr').first().click(); await p.waitForTimeout(350)
check('10.admin-log-opens-in-place', await p.locator('.hb-adminlog .hb-log li').count() >= 1
  && await p.locator('thead th').count() > 0,
  `${await p.locator('.hb-adminlog .hb-log li').count()} entries, table still shown`)
await p.locator('tbody tr').first().click(); await p.waitForTimeout(250)
await p.getByRole('button', { name: 'Price matched', exact: true }).click(); await p.waitForTimeout(300)
const filtered = await p.locator('tbody tr').count()
check('10.admin-filters-by-outcome', filtered > 0 && filtered < allRows,
  `${filtered} of ${allRows}`)
// A7 — the seller's commercial position never crosses to a third party.
const adminText = await p.locator('.hb-content').innerText()
check('10.admin-sees-no-margin-cost-or-floor',
  !/margin|cost|floor/i.test(adminText), 'no seller-internal figure on the admin surface')

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


// ── The validation deck: every message the PM wrote, in the running form ─────
//
// The rules themselves are unit-tested at their boundaries (src/test/rfq.validation.test.ts).
// What this adds is that each sentence is reachable by a person typing into the real field —
// a copy deck nobody can get to is a document, not a product.
await reset()

const openDrawer = async (name) => {
  await p.locator('.hb-prod', { hasText: name }).getByRole('button', { name: /Match my price/ }).click()
  await p.waitForTimeout(300)
}
const qtyBox = () => p.locator('.hb-modal-body input[inputmode="numeric"]').first()
const priceBox = () => p.locator('.hb-modal-body input[inputmode="decimal"]').first()
const fieldOf = (label) => p.locator('.hb-modal-body .hb-field', { hasText: label })
const QTY = /^Quantity \(/
const PRICE = /target price/i
const FILE = /Attach the invoice/i
const msgOf = async (label) => (await fieldOf(label).locator('.hb-error, .hb-warning, .hb-hint').allInnerTexts()).join(' | ')
const closeDrawer = async () => { await p.locator('.hb-modal-head button').click(); await p.waitForTimeout(200) }

// Tomato Paste: sold by carton, min 10, special-price min 20, max 300, stock 260, list 8.900.
await openDrawer('Tomato Paste')

// The instruction the field carries before anything is typed — one of the five sold-by cases.
check('v.qty-sold-by-carton', /sold by carton/i.test(await msgOf(QTY)), await msgOf(QTY))

const qtyCases = [
  ['v.qty-not-numeric', '10 cartons', /numbers only/i],
  ['v.qty-zero', '0', /greater than zero/i],
  ['v.qty-too-large', '2000000', /too large/i],
  ['v.qty-below-minimum', '5', /minimum order quantity is 10 cartons/i],
  ['v.qty-above-maximum', '400', /maximum quantity allowed per request is 300 cartons/i],
  ['v.qty-exceeds-stock', '280', /exceeds the available stock of 260 cartons/i],
  ['v.qty-special-price-minimum', '15', /minimum of 20 cartons to qualify/i],
]
for (const [id, value, re] of qtyCases) {
  await qtyBox().fill(value); await p.waitForTimeout(150)
  const msg = await msgOf(QTY)
  check(id, re.test(msg), `"${value}" → ${msg}`)
}
// The special-price threshold is a warning, not a refusal: the way out is a bigger number.
await qtyBox().fill('15'); await p.waitForTimeout(150)
check('v.qty-special-price-is-a-warning',
  await fieldOf(QTY).locator('.hb-warning').count() === 1
  && await fieldOf(QTY).locator('.hb-error').count() === 0,
  await msgOf(QTY))

// Price, against a list price of 8.900.
await qtyBox().fill('40'); await p.waitForTimeout(150)
const priceCases = [
  ['v.price-format', 'BHD 8.1', /numbers only/i],
  ['v.price-invalid', '.', /valid numeric price/i],
  ['v.price-decimals', '8.1234', /no more than 3 decimal places/i],
  ['v.price-non-positive', '0', /must be greater than/i],
  ['v.price-same-as-current', '8.900', /same as the current price/i],
  ['v.price-not-lower', '9.500', /lower than the current price of .*8\.900/i],
  ['v.price-out-of-range', '0.500', /outside the allowed range/i],
  ['v.price-too-low', '3.000', /significantly lower/i],
]
for (const [id, value, re] of priceCases) {
  await priceBox().fill(value); await p.waitForTimeout(150)
  const msg = await msgOf(PRICE)
  check(id, re.test(msg), `"${value}" → ${msg}`)
}
check('v.price-too-low-is-a-warning',
  await fieldOf(PRICE).locator('.hb-warning').count() === 1
  && await fieldOf(PRICE).locator('.hb-error').count() === 0,
  await msgOf(PRICE))

// The two empty-field messages appear on the attempt to send, not before it.
await qtyBox().fill(''); await priceBox().fill(''); await p.waitForTimeout(150)
check('v.empty-fields-stay-quiet-until-send',
  await p.locator('.hb-modal-body .hb-error').count() === 0,
  'nothing is an error before the first press')
await p.getByRole('button', { name: 'Match price' }).click(); await p.waitForTimeout(250)
check('v.qty-empty', /Enter the quantity/i.test(await msgOf(QTY)), await msgOf(QTY))
check('v.price-empty', /Enter your requested price/i.test(await msgOf(PRICE)), await msgOf(PRICE))

// ── The eight file cases, on the same form ───────────────────────────────────
const fileInput = () => p.locator('.hb-modal-body .hb-dropzone input[type="file"]')
const fileMsg = async () => (await fieldOf(FILE).locator('.hb-error').allInnerTexts()).join(' | ')
const pick = async (files) => { await fileInput().setInputFiles(files); await p.waitForTimeout(250) }
const pdf = (name, bytes = 1_000) => ({ name, mimeType: 'application/pdf', buffer: Buffer.alloc(bytes, 1) })

await pick({ name: 'prices.xlsx', mimeType: 'application/vnd.ms-excel', buffer: Buffer.alloc(50, 1) })
check('v.file-unsupported-type', /not supported.*JPG, PNG, or PDF/i.test(await fileMsg()), await fileMsg())

await pick(pdf('huge-invoice.pdf', 11 * 1024 * 1024))
check('v.file-too-large', /maximum allowed size of 10 MB/i.test(await fileMsg()), await fileMsg())

await pick(pdf('empty-scan.pdf', 0))
check('v.file-empty-or-corrupt', /empty or damaged/i.test(await fileMsg()), await fileMsg())

await pick(pdf(`${'a'.repeat(130)}.pdf`))
check('v.file-name-too-long', /file name is too long/i.test(await fileMsg()), await fileMsg())

await pick([])
check('v.file-none-selected', /Select a file before uploading/i.test(await fileMsg()), await fileMsg())

// The transport failing after every rule has passed is its own sentence, about the
// connection rather than about the file. The switch is on the demo bar, which the open
// drawer covers, so this one case gets its own walk.
await closeDrawer()
await p.getByRole('button', { name: 'fails', exact: true }).click(); await p.waitForTimeout(200)
await openDrawer('Tomato Paste')
await pick(pdf('gulf-foods-invoice.pdf'))
check('v.file-upload-failed', /could not be uploaded/i.test(await fileMsg())
  && await p.locator('.hb-modal-body .hb-filechip').count() === 0, await fileMsg())
await closeDrawer()
await p.getByRole('button', { name: 'succeeds', exact: true }).click(); await p.waitForTimeout(200)
await openDrawer('Tomato Paste')

await pick(pdf('gulf-foods-invoice.pdf'))
check('v.file-attaches', await p.locator('.hb-modal-body .hb-filechip').count() === 1,
  await txt('.hb-modal-body .hb-filechip'))
await pick(pdf('gulf-foods-invoice.pdf'))
check('v.file-duplicate', /already been attached/i.test(await fileMsg())
  && await p.locator('.hb-modal-body .hb-filechip').count() === 1, await fileMsg())

await pick([pdf('page-2.pdf', 1_100), pdf('page-3.pdf', 1_200)])
check('v.file-multiple-attachments', await p.locator('.hb-modal-body .hb-filechip').count() === 3,
  `${await p.locator('.hb-modal-body .hb-filechip').count()} attachments`)
await pick(pdf('page-4.pdf', 1_300))
check('v.file-too-many', /maximum number of allowed attachments/i.test(await fileMsg())
  && await p.locator('.hb-modal-body .hb-filechip').count() === 3, await fileMsg())
// A cap you cannot get back under is a trap: removing one lets the next file in.
const chipNames = async () => (await p.locator('.hb-modal-body .hb-filechip-name').allInnerTexts()).join(',')
await p.locator('.hb-modal-body .hb-filechip').last().getByRole('button', { name: 'Remove' }).click()
await p.waitForTimeout(250)
check('v.file-remove-drops-the-one-asked-for',
  (await chipNames()) === 'gulf-foods-invoice.pdf,page-2.pdf', await chipNames())
await pick(pdf('page-5.pdf', 1_400))
check('v.file-cap-clears-on-remove',
  (await chipNames()) === 'gulf-foods-invoice.pdf,page-2.pdf,page-5.pdf' && (await fileMsg()) === '',
  `${await chipNames()} :: ${await fileMsg()}`)

// All three documents reach the record, not only the first.
await priceBox().fill('8.100'); await qtyBox().fill('40'); await p.waitForTimeout(150)
await p.getByRole('button', { name: 'Match price' }).click(); await p.waitForTimeout(400)
const multiRef = (await txt('.hb-overlay')).match(/SPR-\d{4}-\d{4}/)?.[0] ?? ''
await closeDrawer()
await p.getByRole('button', { name: 'Seller · Dashboard' }).click(); await p.waitForTimeout(250)
await p.locator('tbody tr', { hasText: multiRef }).click(); await p.waitForTimeout(350)
const readbackFiles = await txt('.hb-readback')
check('v.every-attachment-reaches-the-seller',
  /gulf-foods-invoice\.pdf/.test(readbackFiles) && /page-2\.pdf/.test(readbackFiles)
  && /page-5\.pdf/.test(readbackFiles), readbackFiles.slice(-220))

// The other two sold-by instructions that have a free card, and the pack multiple.
await reset()
await openDrawer('Basmati Rice')
check('v.qty-sold-by-pallet', /sold by pallet/i.test(await msgOf(QTY)), await msgOf(QTY))
await qtyBox().fill('5'); await p.waitForTimeout(150)
check('v.qty-not-multiple', /multiples of 2 pallets/i.test(await msgOf(QTY)), await msgOf(QTY))
await closeDrawer()
await openDrawer('White Sugar')
check('v.qty-sold-by-weight', /required quantity in kg/i.test(await msgOf(QTY)), await msgOf(QTY))
await closeDrawer()

// A product with nothing to sell says so on the card, where the buyer is deciding —
// which is different from the controlled-price category, which offers no control at all.
const franks = p.locator('.hb-prod', { hasText: 'Chicken Franks' })
check('v.product-unavailable',
  await franks.locator('button[disabled]').count() === 1
  && /currently unavailable for a special price/i.test(
    await franks.locator('button[disabled]').getAttribute('title') ?? ''),
  await franks.locator('button[disabled]').innerText())
check('v.excluded-category-offers-nothing',
  await p.locator('.hb-prod', { hasText: 'Infant Formula' }).locator('.hb-prod-actions button[disabled]').count() === 0,
  'a controlled-price category renders no request control at all')


await b.close()

report()

/**
 * Print what was collected, whatever happened.
 *
 * A walk that throws half way through — a selector that no longer matches, a control that
 * moved — used to print nothing at all, which says "everything is broken" when the truth
 * is usually "one step is". The results up to the throw are the useful part.
 */
function report() {
const failed = R.filter((r) => !r.ok)
for (const r of R) console.log(`${r.ok ? 'ok  ' : 'FAIL'}  ${r.id.padEnd(34)} ${r.detail}`)
if (errors.length) console.log('\npage errors:', errors)
console.log(`\n${R.length} cases checked, ${failed.length} failing, ${errors.length} page errors`)
process.exit(failed.length || errors.length ? 1 : 0)
}
