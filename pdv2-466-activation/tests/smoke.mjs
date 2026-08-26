import { chromium } from '/opt/node22/lib/node_modules/playwright/index.mjs';
import { readFileSync } from 'node:fs';
const BASE = process.env.BASE || 'http://localhost:4177';
const AXE = readFileSync(new URL('../node_modules/axe-core/axe.min.js', import.meta.url), 'utf8');
let pass = 0, fail = 0;
const check = async (l, fn) => {
  try { const r = await fn();
    if (r === true) { console.log('PASS — ' + l); pass++; }
    else { console.log('FAIL — ' + l + (typeof r === 'string' ? ' :: ' + r : '')); fail++; }
  } catch (e) { console.log('ERR  — ' + l + ' :: ' + e.message); fail++; }
};
const b = await chromium.launch();
const ctx = await b.newContext({ viewport: { width: 1200, height: 1000 } });
const page = await ctx.newPage();
const errors = []; page.on('pageerror', (e) => errors.push(e.message));
await page.goto(BASE + '/', { waitUntil: 'domcontentloaded' }); await page.waitForTimeout(500);

const pick = async (label) => { await page.getByRole('button', { name: label, exact: true }).click(); await page.waitForTimeout(300); };
const main = () => page.locator('main').innerText();
const plan = () => page.locator('aside dl dd').last().innerText();

await check('RTL + Arabic document', async () =>
  (await page.getAttribute('html','dir')) === 'rtl' && (await page.getAttribute('html','lang')) === 'ar');
await check('harness is fenced and labelled dev-only', async () => {
  const a = page.locator('aside[aria-label*="أدوات المطوّر"]');
  return (await a.count()) === 1 && (await a.innerText()).includes('ليس جزءاً من المنتج'); });
await check('harness sits OUTSIDE the component under test', async () =>
  (await page.locator('aside[aria-label*="أدوات المطوّر"] >> css=[role="progressbar"]').count()) === 0);

console.log('\n--- plan derivation per merchant state ---');
await check('base · full 4-step plan', async () =>
  (await plan()) === 'activate-mrsool → apply-routes → enable-fulfilment → link-market');
await pick('مرسول مفعّل مسبقاً');
await check('mrsool active · activation step dropped', async () =>
  !(await plan()).includes('activate-mrsool') && (await main()).includes('مفعّل مسبقاً'));
await pick('بدون تعدّد الأسواق');
await check('no Multi-Markets · enable-multi-branch replaces link-market', async () => {
  const p = await plan(); return p.includes('enable-multi-branch') && !p.includes('link-market'); });
await check('no Multi-Markets · consequence named WITHOUT expanding', async () =>
  (await main()).includes('سنفعّل أداة تعدّد الفروع لمتجرك'));
await pick('الفروع مرتبطة مسبقاً');
await check('already linked · link step dropped', async () => !(await plan()).includes('link-market'));
await pick('فرع سعودي واحد');
await check('single branch · fulfilment NOT auto-enabled', async () => {
  const p = await plan(); return !p.includes('enable-fulfilment'); });
await pick('فروع مختلطة');
await check('mixed · non-KSA branches excluded and named', async () => {
  const t = await main(); return t.includes('لا تظهر') && t.includes('فرع دبي'); });

console.log('\n--- blockers ---');
await pick('لا فروع سعودية');
await check('0 KSA branches · empty state + CTA blocked', async () => {
  const t = await main();
  const cta = page.getByRole('button', { name: /إطلاق الخدمة/ });
  return t.includes('لا توجد فروع داخل السعودية') && await cta.isDisabled(); });
await pick('مسارات متعارضة');
await check('route conflict · CTA blocked until resolved', async () =>
  await page.getByRole('button', { name: /إطلاق الخدمة/ }).isDisabled());
await page.getByRole('button', { name: /استبدال المسارات/ }).click(); await page.waitForTimeout(300);
await check('route conflict · resolving unblocks the CTA', async () =>
  await page.getByRole('button', { name: /إطلاق الخدمة/ }).isEnabled());
await pick('رسوم تتطلّب موافقة');
await check('fees variant · blocked, and cost left blank as a gap', async () => {
  const t = await main();
  return t.includes('قيمة الرسوم غير محدّدة بعد')
    && await page.getByRole('button', { name: /إطلاق الخدمة/ }).isDisabled(); });
await page.locator('#fees').check(); await page.waitForTimeout(300);
await check('fees variant · consent unblocks', async () =>
  await page.getByRole('button', { name: /إطلاق الخدمة/ }).isEnabled());

console.log('\n--- live screen fidelity ---');
await pick('الحالة الأساسية');
await check('setup disclosure is COLLAPSED by default (confirm, not configure)', async () => {
  const t = await main();
  // scope past the dev harness, which prints the derived plan by design
  return !t.includes('تفعيل مرسول على متجرك') && t.includes('ماذا سنجهّز نيابةً عنك'); });
await check('disclosure opens on demand', async () => {
  await page.getByRole('button', { name: /ماذا سنجهّز نيابةً عنك/ }).click(); await page.waitForTimeout(250);
  const t = await main();
  const ok = t.includes('تفعيل مرسول على متجرك');
  await page.getByRole('button', { name: /ماذا سنجهّز نيابةً عنك/ }).click(); await page.waitForTimeout(200);
  return ok; });
await check('live screen: three cards present', async () => {
  const t = await main();
  return t.includes('من أين ستنطلق شحناتك') && t.includes('إلى أي مدى تصل خدمتك') && t.includes('وعد التوصيل لعملائك'); });
await check('live screen: provider label is بوليصات سلة, not Mrsool', async () => {
  const t = await main();
  return t.includes('بوليصات سلة') && t.includes('المزوّد الحالي لهذه المدن: مرسول'); });

console.log('\n--- async activation ---');
await page.getByRole('button', { name: /إطلاق الخدمة/ }).click(); await page.waitForTimeout(400);
await check('progress bar appears with a live value', async () =>
  (await page.locator('[role="progressbar"]').count()) === 1);
await check('per-branch items are listed', async () => (await main()).includes('فرع الرياض'));
await page.waitForTimeout(6500);
await check('success · all steps done', async () => (await main()).includes('متجرك جاهز'));

console.log('\n--- partial failure + retry ---');
await pick('فشل جزئي');
await page.getByRole('button', { name: /إطلاق الخدمة/ }).click(); await page.waitForTimeout(7000);
await check('partial · result names it partial, not failed', async () =>
  (await main()).includes('اكتمل التفعيل جزئياً'));
await check('partial · the failed ITEM is named', async () => (await main()).includes('تعذّر تحديث هذا الفرع'));
await check('partial · completed steps explicitly retained (no rollback)', async () =>
  (await main()).includes('اكتمل ولم يُلغَ'));
await check('partial · retry targets the failed step only', async () =>
  (await page.getByRole('button', { name: /إعادة محاولة هذه الخطوة فقط/ }).count()) >= 1);
const beforeRetry = await main();
await check('partial · later steps never started', async () => beforeRetry.includes('بالانتظار'));
await page.getByRole('button', { name: /إعادة محاولة الخطوة المتعثّرة/ }).click();
await page.waitForTimeout(4500);
await check('retry · succeeds and clears the failure', async () => {
  const t = await main(); return t.includes('متجرك جاهز') || !t.includes('اكتمل التفعيل جزئياً'); });

console.log('\n--- a11y ---');
let v = 0;
for (const [label, sc] of [['idle base','الحالة الأساسية'],['blocked empty','لا فروع سعودية'],
                           ['route conflict','مسارات متعارضة'],['fees variant','رسوم تتطلّب موافقة']]) {
  await pick(sc); await page.waitForTimeout(350);
  await page.evaluate(AXE);
  const res = await page.evaluate(async () => await window.axe.run(document,
    { runOnly: { type: 'tag', values: ['wcag2a','wcag2aa','wcag21a','wcag21aa'] } }));
  v += res.violations.length;
  console.log(`${res.violations.length ? 'FAIL' : 'PASS'} — ${label}: ${res.violations.length}`);
  res.violations.forEach((x) => console.log(`      [${x.impact}] ${x.id} ×${x.nodes.length}: ${x.nodes[0]?.html?.slice(0,90)}`));
}
v === 0 ? pass++ : fail++;
console.log('\nPAGE ERRORS:', errors.length ? [...new Set(errors)].join('\n') : 'none');
console.log(`\nRESULT: ${pass} passed, ${fail} failed, ${v} a11y violations`);
await b.close(); process.exit(fail ? 1 : 0);
