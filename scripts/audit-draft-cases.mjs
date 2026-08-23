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
const txt = async (sel) => (await p.locator(sel).first().innerText().catch(() => '')).replace(/\n/g, ' | ')
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
const panel = await p.locator('.hb-proof').count()
const checks = await p.locator('.hb-proof .hb-check').allInnerTexts()
check('3.extraction-and-checks', panel === 1 && checks.length >= 2, `panel=${panel} checks=${checks.length}`)
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

// ── §5 the four seller actions ───────────────────────────────────────────────
await reset()
await p.getByRole('button', { name: 'Seller · Dashboard' }).click(); await p.waitForTimeout(250)
const rowActions = await p.locator('tbody tr').first().locator('td:last-child button').allInnerTexts()
check('5.seller-accept-modify-reject', ['Accept', 'Counter', 'Decline'].every((x) => rowActions.includes(x)), rowActions.join(' | '))
await p.locator('tbody tr', { hasText: 'SPR-2608-0003' }).getByRole('button', { name: 'Counter' }).click()
await p.waitForTimeout(300)
check('5.detail-is-a-page', await p.locator('.hb-overlay').count() === 0
  && await p.locator('.hb-readback').count() === 1, `overlays=${await p.locator('.hb-overlay').count()}`)
const readback = await txt('.hb-readback')
check('5.buyer-form-read-back', /Asking for/i.test(readback) && /Quantity/i.test(readback)
  && /Supplier offering/i.test(readback) && /Attachment/i.test(readback), readback.slice(0, 220))
const footer = await p.locator('.hb-modal-foot button').allInnerTexts()
check('5.accept-and-template', footer.some((f) => /apply as template/i.test(f)), footer.join(' | '))
await p.getByRole('button', { name: 'Accept & apply as template' }).click(); await p.waitForTimeout(250)
await p.locator('.hb-overlay').last().getByRole('button', { name: 'Accept & apply as template' }).click()
await p.waitForTimeout(350)
await p.locator('.hb-card .hb-tabs .hb-tab', { hasText: 'Sent' }).click(); await p.waitForTimeout(200)
const tmplRow = await p.locator('tbody tr', { hasText: 'SPR-2608-0003' }).innerText()
check('5.template-state', /Template active/i.test(tmplRow), tmplRow.replace(/\n/g, ' | '))

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
check('10.negotiation-and-invoice-flags', pills.some((x) => /Special price negotiation/i.test(x))
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
  && finalRefs.some((r) => /Special price negotiation/i.test(r)),
  finalRefs.map((r) => r.split('\n')[1]).join(' | '))

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
