// Screenshots + behaviour checks with Playwright against index.html.  Usage: node shots.js <out-dir>
const { chromium } = require('playwright'); const path = require('path');
(async () => {
  const b = await chromium.launch(); const url = 'file://' + path.resolve('index.html'); const out = process.argv[2] || '.';
  const errors = [];
  const open = async (w, h, hash, name, set) => {
    const ctx = await b.newContext({ viewport: { width: w, height: h }, deviceScaleFactor: 1 }); const p = await ctx.newPage();
    p.on('pageerror', e => errors.push(name + ': ' + e.message)); p.on('console', m => { if (m.type() === 'error' && !/CERT|fonts\.g/.test(m.text())) errors.push(name + ': ' + m.text()); });
    await p.goto(url + '#' + hash); await p.waitForTimeout(250);
    for (const [k, v] of Object.entries(Object.assign({ view: 'desk', user: 'buyer', lang: 'en' }, set || {}))) { await p.click(`[data-set="${k}"][data-v="${v}"]`); await p.waitForTimeout(120); }
    return { ctx, p };
  };
  const state = p => p.evaluate(() => ({ sw: document.documentElement.scrollWidth, cw: document.documentElement.clientWidth, dir: document.documentElement.dir, title: document.querySelector('.page__title')?.textContent.trim(), crumbs: [...document.querySelectorAll('.crumbs li')].map(l => l.textContent.trim()), cards: document.querySelectorAll('.scard').length, pills: document.querySelectorAll('.pill').length, cur: document.querySelector('.pill[aria-current="page"]')?.textContent, products: document.querySelectorAll('.hb-pcard').length, panel: !!document.querySelector('.fpanel') && getComputedStyle(document.querySelector('.fpanel')).display !== 'none', mobile: !!document.querySelector('.app.m'), categoryTreeInFilters: !!document.querySelector('.fpanel [data-slug], [data-sheet] [data-slug]') }));
  const shot = async (w, h, hash, name, set, act) => {
    const { ctx, p } = await open(w, h, hash, name, set); if (act) await act(p);
    await p.screenshot({ path: path.join(out, name + '.png') }); console.log(name, JSON.stringify(await state(p))); await ctx.close();
  };
  await shot(1440, 900, 'fresh-foods-dairy', 'desk-l0-en');
  await shot(1440, 900, 'dairy-eggs-cheese', 'desk-l1-en');
  await shot(1440, 900, 'fresh-milk', 'desk-l2-en-filtered', null, async p => { await p.click('.fopt input[data-fk="brand"]'); await p.click('[data-promo="again"]'); await p.waitForTimeout(150); });
  await shot(1440, 900, 'fresh-milk', 'desk-l2-en-cart', null, async p => { await p.click('[data-add]'); await p.waitForTimeout(150); await p.click('[data-inc]'); await p.click('[data-inc]'); await p.waitForTimeout(150); await p.click('[data-promo="mine"]'); await p.waitForTimeout(150); });
  await shot(1440, 900, 'fresh-milk', 'desk-l2-guest', { user: 'guest' });
  await shot(1440, 900, 'delicatessen', 'desk-l1-nochildren-en');
  await shot(1440, 900, 'fresh-foods-dairy', 'desk-mega-en', null, async p => { await p.click('[data-mega]'); await p.hover('.mega__item[data-slug="fresh-foods-dairy"]'); await p.hover('.mega__item[data-slug="dairy-eggs-cheese"]'); await p.waitForTimeout(200); });
  await shot(1440, 900, 'dairy-eggs-cheese', 'desk-l1-ar', { lang: 'ar' });
  await shot(1440, 900, 'fresh-milk', 'desk-empty-en', null, async p => { await p.fill('[data-fr="max"]', '0.1'); await p.waitForTimeout(150); });
  await shot(1440, 1000, 'dairy-eggs-cheese', 'phone-l1-en', { view: 'mob' });
  await shot(1440, 1000, 'fresh-milk', 'phone-l2-ar', { view: 'mob', lang: 'ar' });
  await shot(1440, 1000, 'fresh-milk', 'phone-filter-sheet', { view: 'mob' }, async p => { await p.click('#open-filter'); await p.waitForTimeout(200); });
  await shot(1440, 1000, 'fresh-milk', 'phone-sort-sheet', { view: 'mob' }, async p => { await p.click('#open-sort'); await p.waitForTimeout(200); });
  await shot(1440, 1000, 'fresh-milk', 'phone-cart', { view: 'mob' }, async p => { await p.click('[data-add]'); await p.waitForTimeout(200); });
  await shot(1440, 1000, 'fresh-foods-dairy', 'phone-mega', { view: 'mob' }, async p => { await p.click('[data-mega]'); await p.click('.mega__item[data-slug="fresh-foods-dairy"]'); await p.waitForTimeout(200); });
  await shot(390, 844, 'dairy-eggs-cheese', 'narrow-window-en');
  // behaviour
  const { ctx, p } = await open(1440, 900, 'fresh-foods-dairy', 'flow');
  await p.click('.scard[data-slug="dairy-eggs-cheese"]'); await p.waitForTimeout(200); await p.click('.scard[data-slug="fresh-milk"]'); await p.waitForTimeout(200);
  const t1 = await p.evaluate(() => [location.hash, document.querySelector('.page__title').textContent.trim(), document.activeElement.className]);
  await p.click('.fopt input[data-fk="brand"]'); await p.waitForTimeout(100);
  const filtered = await p.evaluate(() => document.querySelectorAll('.hb-pcard').length);
  await p.click('.pill:not([aria-current])'); await p.waitForTimeout(200);
  const afterPill = await p.evaluate(() => [location.hash, document.querySelectorAll('.applied').length, window.scrollY]);
  await p.goBack(); await p.waitForTimeout(200); await p.goBack(); await p.waitForTimeout(200); await p.goBack(); await p.waitForTimeout(200);
  const t2 = await p.evaluate(() => [location.hash, document.querySelector('.page__title').textContent.trim()]);
  await p.goto(url + '#dairy-eggs-cheese'); await p.waitForTimeout(200);
  await p.focus('.scard[data-slug="cheese"]'); await p.keyboard.press('Enter'); await p.waitForTimeout(200);
  const t3 = await p.evaluate(() => [location.hash, document.activeElement.tagName]);
  const tabs = await p.evaluate(() => [...document.querySelectorAll('.pill, .scard, .mega__item, .hb-crumbs__link')].every(a => a.tagName === 'A' && a.tabIndex >= 0));
  await p.fill('#hdr-search', 'milk'); await p.waitForTimeout(100);
  const events = await p.evaluate(() => [...document.querySelectorAll('#px-log li')].map(li => li.textContent.replace(/\n.*/, '')).slice(0, 8));
  const detail = await p.evaluate(() => [...document.querySelectorAll('#px-log li')].filter(li => /subcategory_selected/.test(li.textContent)).map(li => li.textContent.split('\n')[1]));
  console.log('flow', JSON.stringify({ afterTwoClicks: t1, filteredCount: filtered, afterPill, afterBackThrice: t2, keyboardEnter: t3, allLinksTabbable: tabs, events, selected: detail }, null, 1));
  await ctx.close(); await b.close();
  if (errors.length) { console.log('ERRORS', errors); process.exit(1); }
})();
