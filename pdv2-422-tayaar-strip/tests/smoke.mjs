import { chromium } from '/opt/node22/lib/node_modules/playwright/index.mjs';
import { readFileSync } from 'node:fs';
const BASE = process.env.BASE || 'http://localhost:4175';
const AXE = readFileSync(new URL('../node_modules/axe-core/axe.min.js', import.meta.url), 'utf8');

let pass = 0, fail = 0;
const check = async (l, fn) => {
  try { const r = await fn();
    if (r === true) { console.log('PASS — ' + l); pass++; }
    else { console.log('FAIL — ' + l + (typeof r === 'string' ? ' :: ' + r : '')); fail++; }
  } catch (e) { console.log('ERR  — ' + l + ' :: ' + e.message); fail++; }
};

const b = await chromium.launch();
const ctx = await b.newContext({ viewport: { width: 1300, height: 1000 } });
const page = await ctx.newPage();
const errors = []; page.on('pageerror', (e) => errors.push(e.message));
await page.goto(BASE + '/', { waitUntil: 'domcontentloaded' });
await page.waitForTimeout(600);

const OPTS = ['A', 'B', 'C', 'D'];
const CASES = await page.$$eval('#case option', (os) => os.map((o) => o.value));

await check('RTL Arabic document', async () => (await page.getAttribute('html', 'dir')) === 'rtl');
await check('Arabic-Indic numerals', async () => /[٠-٩]/.test(await page.locator('header').innerText()));
await check(`case switcher exposes all cases (${CASES.length})`, async () => CASES.length >= 14);
await check('option switcher exposes 4 options + compare', async () =>
  (await page.getByRole('tab').count()) === 5);

// The surrounding form must be identical across options — only the strip varies.
await check('form is identical across options', async () => {
  const sig = [];
  for (const o of OPTS) {
    await page.getByRole('tab', { name: new RegExp('^' + o + ' ·') }).click();
    await page.waitForTimeout(220);
    sig.push(await page.locator('#prov-sel').count() + '|' + (await page.locator('input[type=radio]').count()));
  }
  return new Set(sig).size === 1 ? true : 'form differs: ' + sig.join(' / ');
});

// Every option × every case renders cleanly.
console.log('\n--- 4 options x ' + CASES.length + ' cases ---');
let combos = 0; const broken = [];
for (const o of OPTS) {
  await page.getByRole('tab', { name: new RegExp('^' + o + ' ·') }).click();
  await page.waitForTimeout(150);
  for (const c of CASES) {
    await page.selectOption('#case', c); await page.waitForTimeout(70);
    const t = await page.locator('main').innerText();
    combos++;
    if (/undefined|NaN|\[object/.test(t) || t.length < 100) broken.push(`${o}/${c}`);
  }
}
await check(`all ${combos} option x case combinations render`, async () =>
  broken.length === 0 ? true : 'broken: ' + broken.slice(0, 8).join(', '));

// Per-case contract checks (option A as the reference skin).
console.log('\n--- case contracts (PRD stories) ---');
await page.getByRole('tab', { name: /^A ·/ }).click(); await page.waitForTimeout(200);
const caseText = async (c) => { await page.selectOption('#case', c); await page.waitForTimeout(220);
  return page.locator('main').innerText(); };

await check('ST1 default · one-week free trial offered', async () => {
  const t = await caseText('default'); return t.includes('تجربة مجانية لمدة أسبوع') && t.includes('تفعيل طيّار'); });
await check('ST1 default · no unvalidated statistics', async () => {
  const t = await caseText('default');
  return !/\d+\s*%|٪/.test(t) ? true : 'found a percentage claim'; });
await check('Scope · Pro/Special gate shows upgrade, not trial', async () => {
  const t = await caseText('locked'); return t.includes('ترقية الباقة') && !t.includes('تفعيل طيّار'); });
await check('ST1 · already installed → no cross-sell offer', async () => {
  const t = await caseText('installed'); return t.includes('مفعّل على متجرك') && !t.includes('تجربة مجانية'); });
await check('ST4 · trial used → paid entry from 5 SAR', async () => {
  const t = await caseText('trial-used'); return t.includes('٥ ر.س') && !t.includes('تفعيل طيّار'); });
await check('ST2 · activating state shows in-dashboard, no redirect', async () => {
  const t = await caseText('activating'); return t.includes('بدون تحويل') && t.includes('جارٍ التفعيل'); });
await check('ST2 · error keeps no half-activated state', async () => {
  const t = await caseText('error'); return t.includes('لم نسجّل أي اشتراك') && t.includes('إعادة المحاولة'); });
await check('ST3 · post-activation names the three promise capabilities', async () => {
  const t = await caseText('activated');
  return t.includes('تحديث حالة الطلب') && t.includes('الباركود') && t.includes('التتبع المباشر'); });
await check('ST4 · trial started', async () => (await caseText('trial-started')).includes('بدأت تجربتك'));
await check('ST4 · days remaining', async () => /متبقية/.test(await caseText('trial-mid')));
await check('ST4 · ending soon, no auto-charge', async () => {
  const t = await caseText('trial-ending'); return t.includes('بدون خصم تلقائي'); });
await check('ST4 · trial ended keeps branches in Quick Delivery', async () => {
  const t = await caseText('trial-ended'); return t.includes('ما زالت ضمن التوصيل السريع'); });
await check('ST4 · paid state', async () => (await caseText('paid')).includes('اشتراك طيّار فعّال'));
await check('Scope · external carrier renders NO strip', async () => {
  const t = await caseText('carrier'); return t.includes('لا يظهر أي شريط'); });
await check('multi-branch case names one account across branches', async () => {
  const t = await caseText('multi-branch'); return t.includes('حساب واحد'); });

// Compare view
console.log('\n--- compare view ---');
await page.getByRole('tab', { name: /مقارنة الأربعة/ }).click(); await page.waitForTimeout(350);
await check('compare shows all 4 options at once', async () =>
  (await page.locator('main section').count()) === 4);
await check('compare respects the selected case', async () => {
  await page.selectOption('#case', 'activated'); await page.waitForTimeout(300);
  const t = await page.locator('main').innerText();
  return (t.match(/طيّار مفعّل — مناديبك يستوفون وعد الساعتين/g) || []).length === 4; });

// a11y
console.log('\n--- a11y (axe wcag2a/aa, wcag21a/aa) ---');
let v = 0;
for (const [label, setup] of [
  ['single · default', async () => { await page.getByRole('tab', { name: /^A ·/ }).click(); await page.selectOption('#case', 'default'); }],
  ['single · error',   async () => { await page.selectOption('#case', 'error'); }],
  ['single · locked',  async () => { await page.selectOption('#case', 'locked'); }],
  ['compare · default',async () => { await page.getByRole('tab', { name: /مقارنة/ }).click(); await page.selectOption('#case', 'default'); }],
]) {
  await setup(); await page.waitForTimeout(400);
  await page.evaluate(AXE);
  const res = await page.evaluate(async () => await window.axe.run(document,
    { runOnly: { type: 'tag', values: ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'] } }));
  v += res.violations.length;
  console.log(`${res.violations.length ? 'FAIL' : 'PASS'} — ${label}: ${res.violations.length}`);
  res.violations.forEach((x) => console.log(`      [${x.impact}] ${x.id} ×${x.nodes.length}: ${x.nodes[0]?.html?.slice(0, 90)}`));
}
v === 0 ? pass++ : fail++;

console.log('\nPAGE ERRORS:', errors.length ? [...new Set(errors)].join('\n') : 'none');
console.log(`\nRESULT: ${pass} passed, ${fail} failed, ${v} a11y violations`);
await b.close();
process.exit(fail ? 1 : 0);
