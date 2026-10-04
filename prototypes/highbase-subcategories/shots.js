// Screenshots + keyboard/behaviour checks with Playwright against index.html
const { chromium } = require('playwright'); const path = require('path');
(async () => {
  const b = await chromium.launch(); const url = 'file://' + path.resolve('index.html'); const out = process.argv[2] || '.';
  const errors = [];
  const shot = async (w, h, hash, lang, name, act) => {
    const ctx = await b.newContext({ viewport: { width: w, height: h }, deviceScaleFactor: 1 }); const p = await ctx.newPage();
    p.on('pageerror', e => errors.push(name + ': ' + e.message)); p.on('console', m => { if (m.type() === 'error') { if (!/CERT|fonts\.g/.test(m.text())) errors.push(name + ': ' + m.text()); } });
    await p.goto(url + '#' + hash); await p.waitForTimeout(300);
    if (lang === 'ar') { await p.click('[data-setlang="ar"]'); await p.waitForTimeout(300); } else { await p.click('[data-setlang="en"]'); await p.waitForTimeout(200); }
    if (act) await act(p);
    await p.screenshot({ path: path.join(out, name + '.png'), fullPage: false });
    const r = await p.evaluate(() => ({ sw: document.documentElement.scrollWidth, cw: document.documentElement.clientWidth, title: document.querySelector('.page__title')?.textContent.trim(), crumbs: [...document.querySelectorAll('.crumbs li')].map(l => l.textContent.trim()), cards: document.querySelectorAll('.scard').length, pills: document.querySelectorAll('.pill').length, cur: document.querySelector('.pill[aria-current="page"]')?.textContent, hasCategoriesFilter: !!document.querySelector('.filters [data-categories]'), dir: document.documentElement.dir }));
    console.log(name, JSON.stringify(r));
    await ctx.close();
  };
  await shot(1440, 900, 'fresh-foods-dairy', 'en', 'desktop-l0-en');
  await shot(1440, 900, 'dairy-eggs-cheese', 'en', 'desktop-l1-en');
  await shot(1440, 900, 'fresh-milk', 'en', 'desktop-l2-en');
  await shot(1440, 900, 'ready-meals', 'en', 'desktop-l1-nochildren-en');
  await shot(1440, 900, 'fresh-foods-dairy', 'en', 'desktop-mega-en', async p => { await p.click('[data-mega]'); await p.hover('.mega__item[data-slug="fresh-foods-dairy"]'); await p.hover('.mega__item[data-slug="dairy-eggs-cheese"]'); await p.waitForTimeout(200); });
  await shot(1440, 900, 'dairy-eggs-cheese', 'ar', 'desktop-l1-ar');
  await shot(390, 844, 'dairy-eggs-cheese', 'en', 'mobile-l1-en');
  await shot(390, 844, 'fresh-milk', 'ar', 'mobile-l2-ar');
  await shot(390, 844, 'fresh-foods-dairy', 'en', 'mobile-mega-en', async p => { await p.click('[data-mega]'); await p.click('.mega__item[data-slug="fresh-foods-dairy"]'); await p.waitForTimeout(200); });
  // behaviour: two clicks from L0 to Fresh Milk, back twice returns; keyboard Tab + Enter opens a card; one pageview per navigation
  const ctx = await b.newContext({ viewport: { width: 1440, height: 900 } }); const p = await ctx.newPage(); p.on('pageerror', e => errors.push('flow: ' + e.message));
  await p.goto(url + '#fresh-foods-dairy'); await p.click('[data-setlang="en"]'); await p.waitForTimeout(200);
  await p.click('.scard[data-slug="dairy-eggs-cheese"]'); await p.waitForTimeout(200); await p.click('.scard[data-slug="fresh-milk"]'); await p.waitForTimeout(200);
  const t1 = await p.evaluate(() => [location.hash, document.querySelector('.page__title').textContent.trim()]);
  await p.goBack(); await p.waitForTimeout(200); await p.goBack(); await p.waitForTimeout(200);
  const t2 = await p.evaluate(() => [location.hash, document.querySelector('.page__title').textContent.trim()]);
  await p.goto(url + '#dairy-eggs-cheese'); await p.waitForTimeout(200);
  await p.focus('.scard[data-slug="cheese"]'); await p.keyboard.press('Enter'); await p.waitForTimeout(200);
  const t3 = await p.evaluate(() => [location.hash, document.activeElement.tagName]);
  const tabs = await p.evaluate(async () => { const links = [...document.querySelectorAll('.pill, .scard')]; return links.every(a => a.tagName === 'A' && a.tabIndex >= 0); });
  await p.fill('#list-search', 'milk'); await p.waitForTimeout(100);
  const events = await p.evaluate(() => { const l = [...document.querySelectorAll('#px-log li')].map(li => li.textContent.split('\n')[0]); return l; });
  console.log('flow', JSON.stringify({ afterTwoClicks: t1, afterBackTwice: t2, keyboardEnter: t3, allLinksTabbable: tabs, events: events.slice(0, 6) }));
  await ctx.close(); await b.close();
  if (errors.length) { console.log('ERRORS', errors); process.exit(1); }
})();
