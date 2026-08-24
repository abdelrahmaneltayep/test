import { chromium } from '/opt/node22/lib/node_modules/playwright/index.mjs';
const b=await chromium.launch();
const pg=await b.newPage({viewport:{width:1440,height:1100}});
const errs=[]; pg.on('pageerror',e=>errs.push(e.message));
await pg.goto('file:///home/user/test/tayaar-quick-delivery/prototype.html'); await pg.waitForTimeout(300);
const A=async(l,f)=>{try{const r=await f();console.log((r===true?'PASS':'FAIL')+' — '+l+(typeof r==='string'?' :: '+r:''))}catch(e){console.log('ERR  — '+l+' :: '+e.message)}};
const go=async k=>{await pg.evaluate(x=>loadScenario(x),k);await pg.waitForTimeout(180)};

await go('st1-carrier');
await A('E14 external carrier → correctly no cross-sell', async()=> (await pg.locator('.ty').count())===0);
await go('st1-per');
await A('per-branch: table rows render', async()=> (await pg.locator('.perrow').count())===3);
await A('per-branch: readiness counts own-courier branches only', async()=>
  (await pg.locator('.ready-h h4').innerText()).includes('2 فرع'));
await go('st1-basic');
await A('E4 Basic → upgrade, no trial', async()=>{const t=await pg.locator('.ty').innerText();
  return t.includes('ترقية الباقة')&&!t.includes('ابدأ أسبوع مجاني');});
await go('st1-used');
await A('E2 trial used → paid only', async()=>{const t=await pg.locator('.ty').innerText();
  return t.includes('5 ر.س')&&!t.includes('ابدأ أسبوع مجاني');});
await go('st1-paid');
await A('E1 already paid → no card, reqs met', async()=>
  (await pg.locator('.ty').count())===0 && (await pg.locator('.req.met').count())===3);
await go('st4-grace');
await A('ST5 grace → promise still shown', async()=> (await pg.locator('.promise-note.good').count())>=1);
await A('grace banner explains customer protection', async()=>
  (await pg.locator('.alert').first().innerText()).includes('48 ساعة'));
await go('st4-lapsed');
await A('ST5 lapsed → promise withdrawn', async()=> (await pg.locator('.promise-note.bad').count())>=1);
await A('ST5 lapsed → NOT removed from Quick Delivery', async()=>
  (await pg.locator('.alert').first().innerText()).includes('ما زالت ضمن التوصيل السريع'));
await A('ST5 lapsed → one-tap restore', async()=> (await pg.locator('[data-act="subscribe"]').count())>=1);
await go('st5-declined');
await A('ST5 declined → consequence stated, reversible', async()=>{
  const t=await pg.locator('main').innerText();
  return t.includes('بدون وعد الساعتين')&&(await pg.locator('[data-act="undecline"]').count())===1;});
await go('st2-fail');
await pg.locator('[data-act="consent"]').click(); await pg.waitForTimeout(120);
await pg.locator('[data-act="activate"]').click(); await pg.waitForTimeout(2400);
await A('E6 failure modal', async()=> (await pg.locator('.modal').innerText()).includes('تعذّر'));
await pg.locator('[data-act="close"]').first().click(); await pg.waitForTimeout(200);
await A('E6 no half-activated state', async()=> (await pg.locator('.req.unmet').count())===3);
// subscribe from lapsed restores
await go('st4-lapsed'); await pg.locator('[data-act="subscribe"]').first().click(); await pg.waitForTimeout(250);
await A('restore works end-to-end', async()=> (await pg.locator('.req.met').count())===3);
console.log('\nPAGE ERRORS:', errs.length?errs.join('\n'):'none');
await b.close();
