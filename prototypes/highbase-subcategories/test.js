// node test.js — the pure rules the brief asks to be tested: breadcrumb, and the no-children case.
const M = require('./model.js');
let pass = 0, fail = 0;
const eq = (a, b, msg) => { const ok = JSON.stringify(a) === JSON.stringify(b); ok ? pass++ : fail++; console.log((ok ? 'ok   ' : 'FAIL ') + msg + (ok ? '' : '\n      got ' + JSON.stringify(a) + '\n      want ' + JSON.stringify(b))); };

// Breadcrumb on a level-2 page: Home > level 0 > level 1 > current; only the current is not a link.
const fm = M.BY['fresh-milk'];
eq(M.breadcrumb(fm, 'en').map(i => i.name), ['Home', 'Fresh Foods & Dairy', 'Dairy, Eggs & Cheese', 'Fresh Milk'], 'breadcrumb names, level 2');
eq(M.breadcrumb(fm, 'en').map(i => i.current), [false, false, false, true], 'only the current page is plain text');
eq(M.breadcrumb(M.BY['fresh-foods-dairy'], 'en').map(i => i.name), ['Home', 'Fresh Foods & Dairy'], 'breadcrumb, level 0 — no repeated title');
eq(M.breadcrumb(fm, 'ar')[0].name, 'الرئيسية', 'breadcrumb home is localised');

// Sections by level
eq(M.section(M.BY['fresh-foods-dairy']).kind, 'cards', 'level 0 with children → cards');
eq(M.section(M.BY['dairy-eggs-cheese']).kind, 'cards', 'level 1 with children → cards');
eq(M.section(M.BY['dairy-eggs-cheese']).items.length, 9, 'level 1 shows all nine level-2 children');
// No children → sibling pills under the parent, current marked, never an empty card row
const rm = M.section(M.BY['ready-meals']);
eq(rm.kind, 'pills', 'level 1 without children → pills');
eq(rm.parent.slug, 'fresh-foods-dairy', 'pills are labelled with the parent');
eq(rm.items.map(i => i.slug).includes('ready-meals'), true, 'the current category is among the pills');
eq(rm.current.slug, 'ready-meals', 'the current pill is marked');
const l2 = M.section(fm);
eq(l2.kind, 'pills', 'level 2 → pills');
eq(l2.items.length, 9, 'level 2 pills are the parent\'s nine children');

// Counts: a parent's count is the sum of its leaves
const dairy = M.BY['dairy-eggs-cheese'];
eq(M.count(dairy), dairy.children.reduce((a, c) => a + M.count(c), 0), 'parent count = sum of children');
eq(M.count(M.BY['fresh-foods-dairy']) >= M.count(dairy), true, 'top-level count ≥ child count');

// URL contract
eq(M.url('fresh-milk', 'en'), '/bh-en/storefront/products?filter[category]=fresh-milk', 'canonical URL, en');
eq(M.url('fresh-milk', 'ar'), '/bh-ar/storefront/products?filter[category]=fresh-milk', 'canonical URL, ar');

console.log(`\n${pass} passed, ${fail} failed`);
process.exit(fail ? 1 : 0);
