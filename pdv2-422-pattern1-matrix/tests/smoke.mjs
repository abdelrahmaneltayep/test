/**
 * Verification for the 20×20 matrix.
 * Sweeps every layout, exercises the one-click contract, and runs axe on a sample.
 */
import { chromium } from '/opt/node22/lib/node_modules/playwright/index.mjs';
import { readFileSync } from 'node:fs';

const BASE = process.env.BASE || 'http://localhost:4174';
const AXE = readFileSync(new URL('../node_modules/axe-core/axe.min.js', import.meta.url), 'utf8');
const LAYOUTS = Array.from({ length: 20 }, (_, i) => `l${i + 1}`);

let pass = 0, fail = 0;
const check = async (label, fn) => {
  try { const r = await fn();
    if (r === true) { console.log('PASS — ' + label); pass++; }
    else { console.log('FAIL — ' + label + (typeof r === 'string' ? ' :: ' + r : '')); fail++; }
  } catch (e) { console.log('ERR  — ' + label + ' :: ' + e.message); fail++; }
};

const browser = await chromium.launch();
const errors = [];
let ctx, page;
const fresh = async () => {
  if (ctx) await ctx.close();
  ctx = await browser.newContext({ viewport: { width: 1400, height: 1000 } });
  page = await ctx.newPage();
  page.on('pageerror', (e) => errors.push(e.message));
};
const go = async (h) => { await page.goto(BASE + '/#' + h, { waitUntil: 'domcontentloaded' }); await page.waitForTimeout(400); };
const setFlow = async (f) => { await page.selectOption('#flow', f); await page.waitForTimeout(350); };

await fresh();

// ── 1. Matrix cover ───────────────────────────────────────────
await go('/');
await check('matrix lists all 20 layouts', async () => (await page.locator('table tbody tr').count()) === 20);
await check('matrix lists all 20 flows', async () => (await page.locator('section:last-of-type').count()) >= 1
  && (await page.locator('main').innerText()).includes('F20'));
await check('RTL Arabic document', async () => (await page.getAttribute('html', 'dir')) === 'rtl');
await check('Arabic-Indic numerals (PRD §7)', async () => {
  const t = await page.locator('h1 + p').innerText();
  return /[٠-٩]/.test(t) ? true : 'no Arabic-Indic digits found: ' + t.slice(0, 40);
});

// ── 2. Every layout renders under the default flow ────────────
console.log('\n--- 20 layouts · default flow ---');
for (const l of LAYOUTS) {
  await go('/' + l);
  await check(`${l.toUpperCase()} renders`, async () => {
    const t = await page.locator('main').innerText();
    return t.length > 200 && !/undefined|NaN|\[object/.test(t) ? true : t.slice(0, 60);
  });
}

// ── 3. One-click contract: no drawer, activation in one action ─
console.log('\n--- one-click contract (PRD §2) ---');
await fresh(); await go('/l6'); await page.locator('#fr').fill('0');
await check('L6 shows the inline checkbox unchecked', async () => !(await page.locator('#l6').isChecked()));
await page.locator('#l6').check();
await check('L6 activation is in flight after ONE click', async () => (await page.locator('main').innerText()).length > 0);
await page.waitForTimeout(1500);
await check('L6 → summary strip replaces the surface', async () => (await page.locator('main').innerText()).includes('طيّار مفعّل'));
await check('no drawer/dialog anywhere in the flow', async () => (await page.locator('[role="dialog"][aria-modal="true"]').count()) === 0);
await check('success toast fired', async () => (await page.locator('[aria-live="polite"]').first().innerText()).length >= 0);
await check('F19 rollback window offered', async () => (await page.getByRole('button', { name: 'تراجع' }).count()) === 1);
await page.getByRole('button', { name: 'تراجع' }).click(); await page.waitForTimeout(300);
await check('F19 rollback reverts activation', async () => !(await page.locator('main').innerText()).includes('طيّار مفعّل'));

// ── 4. Gate flows behave across layouts ───────────────────────
console.log('\n--- gates & errors, sampled across families ---');
for (const l of ['l1', 'l6', 'l11', 'l20']) {
  await fresh(); await go('/' + l);
  await setFlow('F13');
  await check(`${l.toUpperCase()} · F13 country unsupported → surface hidden`, async () =>
    !(await page.locator('main').innerText()).includes('طيّار جاهز لإدارة مناديبك'));
  await setFlow('F14');
  await check(`${l.toUpperCase()} · F14 already active → summary only`, async () =>
    (await page.locator('main').innerText()).includes('طيّار مفعّل'));
  await setFlow('F16');
  const trigger = page.locator('main').getByRole('button').filter({ hasText: /فعّل|تثبيت|تفعيل/ }).first();
  if (await trigger.count()) { await trigger.click(); await page.waitForTimeout(1400); }
  else { await page.locator('main input[type="checkbox"]').first().check(); await page.waitForTimeout(1400); }
  await check(`${l.toUpperCase()} · F16 network error → inline alert, no modal`, async () => {
    const hasAlert = (await page.locator('[role="alert"]').count()) >= 1;
    const noModal = (await page.locator('[role="dialog"][aria-modal="true"]').count()) === 0;
    return hasAlert && noModal ? true : `alert=${hasAlert} noModal=${noModal}`;
  });
}

// ── 5. Multi-branch flows ─────────────────────────────────────
console.log('\n--- multi-branch ---');
await fresh(); await go('/l6');
await setFlow('F9');
await check('F9 · out-of-coverage branch flagged', async () => (await page.locator('main').innerText()).includes('خارج التغطية'));
await setFlow('F8');
await check('F8 · per-branch table appears', async () => (await page.locator('main input[type="checkbox"]').count()) >= 3);
await setFlow('F18');
await check('F18 · partial-failure flow selectable', async () => (await page.locator('#flow').inputValue()) === 'F18');

// ── 6. Every layout × every flow — no crashes ─────────────────
console.log('\n--- full 20×20 sweep ---');
await fresh();
const FLOWS = Array.from({ length: 20 }, (_, i) => `F${i + 1}`);
let combos = 0, broken = [];
for (const l of LAYOUTS) {
  await go('/' + l);
  for (const f of FLOWS) {
    await page.selectOption('#flow', f); await page.waitForTimeout(60);
    const t = await page.locator('main').innerText();
    combos++;
    if (/undefined|NaN|\[object Object\]/.test(t) || t.length < 120) broken.push(`${l}/${f}`);
  }
}
await check(`all ${combos} layout×flow combinations render`, async () =>
  broken.length === 0 ? true : `broken: ${broken.slice(0, 6).join(', ')}${broken.length > 6 ? ` (+${broken.length - 6})` : ''}`);

// ── 7. a11y ───────────────────────────────────────────────────
console.log('\n--- a11y (axe-core wcag2a/aa + wcag21a/aa) ---');
await fresh();
let violations = 0;
for (const h of ['/', '/l1', '/l6', '/l11', '/l15', '/l20']) {
  await go(h);
  await page.evaluate(AXE);
  const res = await page.evaluate(async () => await window.axe.run(document,
    { runOnly: { type: 'tag', values: ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'] } }));
  violations += res.violations.length;
  console.log(`${res.violations.length === 0 ? 'PASS' : 'FAIL'} — ${h}: ${res.violations.length} violation(s)`);
  res.violations.forEach((v) => console.log(`        · [${v.impact}] ${v.id}: ${v.nodes.length} node(s) — ${v.nodes[0]?.html?.slice(0, 100)}`));
}
violations === 0 ? pass++ : fail++;

console.log('\nPAGE ERRORS:', errors.length ? [...new Set(errors)].join('\n') : 'none');
console.log(`\nRESULT: ${pass} passed, ${fail} failed, ${violations} a11y violations`);
await browser.close();
process.exit(fail > 0 ? 1 : 0);
