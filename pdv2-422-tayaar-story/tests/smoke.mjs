import { chromium } from '/opt/node22/lib/node_modules/playwright/index.mjs';
import { readFileSync } from 'node:fs';
const BASE = process.env.BASE || 'http://localhost:4176';
const AXE = readFileSync(new URL('../node_modules/axe-core/axe.min.js', import.meta.url), 'utf8');

let pass = 0, fail = 0;
const check = async (l, fn) => {
  try { const r = await fn();
    if (r === true) { console.log('PASS — ' + l); pass++; }
    else { console.log('FAIL — ' + l + (typeof r === 'string' ? ' :: ' + r : '')); fail++; }
  } catch (e) { console.log('ERR  — ' + l + ' :: ' + e.message); fail++; }
};

const b = await chromium.launch();
const ctx = await b.newContext({ viewport: { width: 1400, height: 1050 } });
const page = await ctx.newPage();
const errors = []; page.on('pageerror', (e) => errors.push(e.message));
await page.goto(BASE + '/', { waitUntil: 'domcontentloaded' });
await page.waitForTimeout(700);

const rail = page.locator('nav[aria-label="فصول الرحلة"] button');
const OPTS = ['A', 'B', 'C', 'D'];
const chapterCount = await rail.count();
const pickOpt = async (o) => { await page.getByRole('tab', { name: new RegExp('^' + o + ' ·') }).click(); await page.waitForTimeout(180); };
const pickCh = async (i) => { await rail.nth(i).click(); await page.waitForTimeout(260); };
const narration = () => page.locator('main h2').first().innerText();

await check('RTL Arabic document', async () => (await page.getAttribute('html', 'dir')) === 'rtl');
await check('story has 10 main chapters', async () => chapterCount === 10);
await check('4 options + compare', async () => (await page.getByRole('tab').count()) === 5);

/* ── The arc: the promise thread must actually change ─────── */
console.log('\n--- the promise thread (the spine of the arc) ---');
const promiseAt = async (i) => { await pickCh(i); return page.locator('main').locator('text=ما يراه العميل عند الدفع').locator('..').innerText(); };
await check('ch1 · promise is OFF at the start', async () => (await promiseAt(0)).includes('لا يظهر لعميلك'));
await check('ch7 · promise is ON after the first tracked delivery', async () => (await promiseAt(6)).includes('يظهر لعميلك'));
await check('ch9 · promise is AT RISK when the trial ends', async () => (await promiseAt(8)).includes('مهدَّد'));
await check('ch10 · promise is ON again after converting', async () => (await promiseAt(9)).includes('يظهر لعميلك'));
await check('the arc actually turns (off → on → risk → on)', async () => {
  const seq = [];
  for (const i of [0, 6, 8, 9]) seq.push(await promiseAt(i));
  return new Set(seq).size >= 3 ? true : 'promise never changes';
});

/* ── Storytelling substance ────────────────────────────────── */
console.log('\n--- storytelling ---');
await check('every chapter has a moment, narration and source', async () => {
  const missing = [];
  for (let i = 0; i < chapterCount; i++) {
    await pickCh(i);
    const h = await narration();
    const nar = await page.locator('main h2 + p').first().innerText();
    const src = await page.locator('header p').last().innerText();
    if (!h.trim() || nar.length < 40 || !src.includes('·')) missing.push(i + 1);
  }
  return missing.length === 0 ? true : 'incomplete chapters: ' + missing.join(',');
});
await check('chapters 2+ each state what changed', async () => {
  const missing = [];
  for (let i = 1; i < chapterCount; i++) {
    await pickCh(i);
    if ((await page.locator('main').innerText()).indexOf('→') === -1) missing.push(i + 1);
  }
  return missing.length === 0 ? true : 'no delta on: ' + missing.join(',');
});
await check('no statistics anywhere in the story', async () => {
  for (let i = 0; i < chapterCount; i++) {
    await pickCh(i);
    const t = await page.locator('main').innerText();
    if (/\d+\s*%|٪/.test(t)) return `chapter ${i + 1} contains a percentage`;
  }
  return true;
});

/* ── Branches ──────────────────────────────────────────────── */
console.log('\n--- alternate paths ---');
await pickCh(2);
await check('offer chapter offers the plan-gate branch', async () =>
  (await page.getByRole('button', { name: /باقتك لا تشمله/ }).count()) === 1);
await page.getByRole('button', { name: /باقتك لا تشمله/ }).click(); await page.waitForTimeout(300);
await check('plan-gate branch shows upgrade, not trial', async () => {
  const t = await page.locator('main').innerText(); return t.includes('ترقية الباقة') && !t.includes('تفعيل طيّار'); });
await check('branch offers a way back to the main arc', async () =>
  (await page.getByRole('button', { name: /العودة إلى/ }).count()) === 1);
await page.getByRole('button', { name: /العودة إلى/ }).click(); await page.waitForTimeout(300);
await check('returning lands on the parent chapter', async () => (await narration()).includes('القطعة الناقصة'));

await pickCh(3);
await check('activation chapter offers the failure branch', async () =>
  (await page.getByRole('button', { name: /تعثّر التفعيل/ }).count()) === 1);
await page.getByRole('button', { name: /تعثّر التفعيل/ }).click(); await page.waitForTimeout(300);
await check('failure branch leaves no half-activated state', async () =>
  (await page.locator('main').innerText()).includes('لم نسجّل أي اشتراك'));

await pickCh(8);
await page.getByRole('button', { name: /لم تستمر/ }).click(); await page.waitForTimeout(300);
await check('lapsed branch keeps branches in Quick Delivery', async () =>
  (await page.locator('main').innerText()).includes('ما زالت ضمن التوصيل السريع'));
await check('lapsed branch flags the open question, not a decision', async () =>
  (await page.locator('main').innerText()).includes('سؤال مفتوح'));

/* ── The story applied to all 4 options ────────────────────── */
console.log('\n--- 4 options x every chapter ---');
let combos = 0; const broken = [];
for (const o of OPTS) {
  await pickOpt(o);
  for (let i = 0; i < chapterCount; i++) {
    await pickCh(i);
    const t = await page.locator('main').innerText();
    combos++;
    if (/undefined|NaN|\[object/.test(t) || t.length < 150) broken.push(`${o}/ch${i + 1}`);
  }
}
await check(`all ${combos} option x chapter combinations render`, async () =>
  broken.length === 0 ? true : 'broken: ' + broken.slice(0, 6).join(', '));

/* ── Navigation ────────────────────────────────────────────── */
console.log('\n--- navigation ---');
await pickOpt('A'); await pickCh(0);
await page.getByRole('button', { name: /التالي/ }).click(); await page.waitForTimeout(300);
await check('next advances the story', async () => (await narration()).includes('ولهذا لا يظهر'));
await page.getByRole('button', { name: /السابق/ }).click(); await page.waitForTimeout(300);
await check('previous goes back', async () => (await narration()).includes('توصّل بنفسك'));
await page.keyboard.press('ArrowLeft'); await page.waitForTimeout(300);
await check('arrow keys navigate (RTL: left = forward)', async () => (await narration()).includes('ولهذا لا يظهر'));
await page.getByRole('button', { name: /تشغيل/ }).click(); await page.waitForTimeout(300);
await check('autoplay toggles on', async () =>
  (await page.getByRole('button', { name: /إيقاف/ }).count()) === 1);
await page.getByRole('button', { name: /إيقاف/ }).click(); await page.waitForTimeout(200);

/* ── Compare within a chapter ──────────────────────────────── */
await pickCh(2);   // a chapter that actually has a strip
await page.getByRole('tab', { name: /الأربعة معاً/ }).click(); await page.waitForTimeout(400);
await check('compare shows the same chapter in all 4 options', async () =>
  (await page.locator('main section').count()) === 4);
await pickCh(0);
await check('compare handles a chapter with no strip', async () =>
  (await page.locator('main').innerText()).includes('لا فرق بين الخيارات'));

/* ── a11y ──────────────────────────────────────────────────── */
console.log('\n--- a11y (axe wcag2a/aa, wcag21a/aa) ---');
let v = 0;
for (const [label, setup] of [
  ['ch1 (no strip)',   async () => { await pickOpt('A'); await pickCh(0); }],
  ['ch3 (offer)',      async () => { await pickCh(2); }],
  ['ch9 (at risk)',    async () => { await pickCh(8); }],
  ['compare',          async () => { await page.getByRole('tab', { name: /الأربعة معاً/ }).click(); await pickCh(2); }],
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
