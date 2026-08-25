/**
 * Smoke + a11y verification for the 5-pattern prototype.
 * Maps 1:1 onto the 10 success criteria in the build brief.
 * Run: npm run build && npx vite preview --port 4173 & node tests/smoke.mjs
 */
import { chromium } from '/opt/node22/lib/node_modules/playwright/index.mjs';
import { readFileSync } from 'node:fs';

const BASE = process.env.BASE || 'http://localhost:4173';
const AXE = readFileSync(new URL('../node_modules/axe-core/axe.min.js', import.meta.url), 'utf8');

let pass = 0, fail = 0;
const check = async (label, fn) => {
  try {
    const r = await fn();
    if (r === true) { console.log('PASS — ' + label); pass++; }
    else { console.log('FAIL — ' + label + (typeof r === 'string' ? ' :: ' + r : '')); fail++; }
  } catch (e) { console.log('ERR  — ' + label + ' :: ' + e.message); fail++; }
};

const browser = await chromium.launch();
const errors = [];

/** Fresh context per section — activation state is global by design. */
let ctx, page;
const fresh = async () => {
  if (ctx) await ctx.close();
  ctx = await browser.newContext({ viewport: { width: 1400, height: 1000 } });
  page = await ctx.newPage();
  page.on('pageerror', (e) => errors.push(e.message));
};
const go = async (hash) => {
  await page.goto(BASE + '/#' + hash, { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(450);
};
await fresh();

// ── 1 & 9: app boots, RTL Arabic ──────────────────────────────
await go('/pattern-1');
await check('1. app boots', async () => (await page.locator('aside').count()) === 1);
await check('9. RTL + Arabic document', async () =>
  (await page.getAttribute('html', 'dir')) === 'rtl' && (await page.getAttribute('html', 'lang')) === 'ar');
await check('9. Western numerals (production-accurate)', async () => {
  const t = await page.locator('main').innerText();
  return /\d/.test(t) && !/[٠-٩]/.test(t) ? true : 'found Arabic-Indic digits';
});

// ── 2: navigate all 5 patterns ────────────────────────────────
for (const [i, hash] of ['/pattern-1','/pattern-2','/pattern-3','/pattern-4','/pattern-5'].entries()) {
  await go(hash);
  await check(`2. pattern ${i + 1} renders`, async () => {
    const t = await page.locator('main').innerText();
    return t.length > 120 && !/undefined|NaN|\[object/.test(t) ? true : t.slice(0, 60);
  });
}

// ── 3: Pattern 1 full path ────────────────────────────────────
await go('/pattern-1');
await check('3. no Tayaar card by default (بوليصات سلة)', async () => (await page.locator('text=طيّار يوفّر').count()) === 0);
await page.getByRole('radio', { name: /توصيل خاص/ }).check(); await page.waitForTimeout(250);
await check('3. sub-provider dropdown appears', async () => await page.locator('#sub-provider').isVisible());
await check('3. still no card before choosing مناديب', async () => (await page.locator('text=طيّار يوفّر').count()) === 0);
await page.selectOption('#sub-provider', 'carrier'); await page.waitForTimeout(250);
await check('3. external carrier → correctly NO cross-sell', async () => (await page.locator('text=طيّار يوفّر').count()) === 0);
await page.selectOption('#sub-provider', 'own'); await page.waitForTimeout(300);
await check('3. مناديب متجري → card fires', async () => (await page.locator('text=طيّار يوفّر').count()) === 1);
await check('3. launch CTA gated', async () => await page.getByRole('button', { name: /إطلاق الخدمة/ }).isDisabled());
await page.locator('#failrate').fill('0');   // deterministic success for the happy path
await page.getByRole('button', { name: 'ابدأ أسبوع مجاني' }).first().click(); await page.waitForTimeout(400);
await check('3. drawer opens', async () => await page.getByRole('dialog', { name: /تفعيل تجربة طيّار/ }).isVisible());
await page.getByRole('button', { name: 'تفعيل التجربة الآن' }).click(); await page.waitForTimeout(1600);
await check('3. activation completes → summary strip', async () => (await page.locator('main').innerText()).includes('مناديبك يستوفون'));
await check('3. trial banner appears (ST4)', async () => (await page.locator('main').innerText()).includes('تجربة طيّار فعّالة'));
await check('3. launch CTA now enabled', async () => await page.getByRole('button', { name: /إطلاق الخدمة/ }).isEnabled());
await check('3. no page reload (SPA)', async () => (await page.evaluate(() => performance.getEntriesByType('navigation').length)) === 1);

// ── 4: Pattern 2 marketplace → detail → same drawer ───────────
await fresh();
await go('/pattern-2');
await check('4. recommended shelf shows Tayaar', async () => (await page.locator('text=موصى به من سلة').count()) >= 1);
await page.locator('a[href="#/pattern-2/app/tayaar"]').first().click(); await page.waitForTimeout(500);
await check('4. detail route loads', async () => page.url().includes('/app/tayaar'));
await check('4. unvalidated stat carries قيد التحقق', async () => (await page.locator('main').innerText()).includes('قيد التحقق'));
await check('4. category filter works', async () => {
  await go('/pattern-2');
  await page.getByRole('tab', { name: 'المدفوعات' }).click(); await page.waitForTimeout(250);
  const t = await page.locator('main').innerText();
  return t.includes('قسّطها') && !t.includes('رسائلي');
});

// ── 5: Pattern 3 wizard ───────────────────────────────────────
await fresh();
await go('/pattern-3');
for (let i = 0; i < 3; i++) { await page.getByRole('button', { name: 'التالي' }).click(); await page.waitForTimeout(200); }
await check('5. reaches step 4', async () => (await page.locator('main').innerText()).includes('طريقة التنفيذ'));
await check('5. Next blocked until fulfillment chosen', async () => await page.getByRole('button', { name: 'التالي' }).isDisabled());
await page.getByRole('radio', { name: /مناديب متجري/ }).check(); await page.waitForTimeout(300);
await check('5. own couriers → Tayaar recommendation tile', async () => (await page.locator('text=فعّل طيّار').count()) >= 1);
await check('5. "later" and "skip" both offered', async () => {
  const t = await page.locator('main').innerText();
  return t.includes('سأعدّ هذا لاحقًا') && t.includes('تخطّي');
});

// ── 6: Pattern 4 banner + snooze persistence ──────────────────
await fresh();
await go('/pattern-4');
await check('6. expanded banner renders', async () => (await page.locator('[aria-label="عرض طيّار"]').count()) === 1);
await page.getByRole('button', { name: 'مضغوط' }).click(); await page.waitForTimeout(250);
await check('6. compact variant renders', async () => (await page.locator('[aria-label="عرض طيّار"]').count()) === 1);
await page.getByRole('button', { name: 'ذكّرني لاحقًا' }).first().click(); await page.waitForTimeout(300);
await check('6. snooze hides banner', async () => (await page.locator('[aria-label="عرض طيّار"]').count()) === 0);
await check('6. snooze written to localStorage', async () =>
  await page.evaluate(() => Number(localStorage.getItem('pdv2422.banner.snoozeUntil')) > Date.now()));
await go('/pattern-4');
await check('6. snooze survives reload (24h)', async () => (await page.locator('[aria-label="عرض طيّار"]').count()) === 0);

// ── 7: Pattern 5 empty state → live state ─────────────────────
await fresh(); const p2 = page;
await go('/pattern-5');
await check('7. empty-state prompt shows', async () =>
  (await p2.getByRole('button', { name: 'فعّل طيّار مجانًا' }).count()) === 1);
await p2.getByRole('button', { name: 'فعّل طيّار مجانًا' }).click(); await p2.waitForTimeout(400);
await p2.getByRole('button', { name: 'تفعيل التجربة الآن' }).click(); await p2.waitForTimeout(1800);
await check('7. transitions to live state', async () => (await p2.locator('main').innerText()).includes('مناديب متاحون للإسناد'));

// ── 8: failure rate 100% → error states ───────────────────────
await fresh(); const p3 = page;
await go('/pattern-1');
await p3.locator('#failrate').fill('100');
await p3.getByRole('radio', { name: /توصيل خاص/ }).check(); await p3.waitForTimeout(200);
await p3.selectOption('#sub-provider', 'own'); await p3.waitForTimeout(300);
await p3.getByRole('button', { name: 'ابدأ أسبوع مجاني' }).first().click(); await p3.waitForTimeout(400);
await p3.getByRole('button', { name: 'تفعيل التجربة الآن' }).click(); await p3.waitForTimeout(1700);
await check('8. 100% failure → error surfaces in drawer', async () => (await p3.locator('[role="dialog"]').innerText()).includes('تعذّر تفعيل التجربة'));
await check('8. no half-activated state', async () => (await p3.locator('[role="dialog"]').innerText()).includes('لم نسجّل أي اشتراك'));
await check('8. retry offered', async () => (await p3.getByRole('button', { name: 'إعادة المحاولة' }).count()) >= 1);

// ── 10: axe-core a11y on all 5 routes ─────────────────────────
console.log('\n--- a11y (axe-core, wcag2a+wcag2aa) ---');
let totalViolations = 0;
await fresh();
for (const hash of ['/pattern-1','/pattern-2','/pattern-3','/pattern-4','/pattern-5']) {
  await go(hash);
  await page.evaluate(AXE);
  const res = await page.evaluate(async () =>
    await window.axe.run(document, { runOnly: { type: 'tag', values: ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'] } }));
  const v = res.violations;
  totalViolations += v.length;
  console.log(`${v.length === 0 ? 'PASS' : 'FAIL'} — 10. ${hash}: ${v.length} violation(s)`);
  v.forEach((x) => console.log(`        · [${x.impact}] ${x.id}: ${x.help} (${x.nodes.length} node(s))
          ${x.nodes[0]?.html?.slice(0, 110)}`));
}
totalViolations === 0 ? pass++ : fail++;

console.log('\nPAGE ERRORS:', errors.length ? errors.join('\n') : 'none');
console.log(`\nRESULT: ${pass} passed, ${fail} failed, ${totalViolations} a11y violations`);
await browser.close();
process.exit(fail > 0 ? 1 : 0);
