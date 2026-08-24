import { chromium } from '/opt/node22/lib/node_modules/playwright/index.mjs';
const b=await chromium.launch();
const pg=await b.newPage({viewport:{width:1440,height:1100}});
const errs=[]; pg.on('pageerror',e=>errs.push(e.message));
await pg.goto('file:///home/user/test/tayaar-quick-delivery/prototype.html',{waitUntil:'domcontentloaded'});
await pg.waitForTimeout(400);
const A=async(l,f)=>{try{const r=await f();console.log((r===true?'PASS':'FAIL')+' — '+l+(typeof r==='string'?' :: '+r:''))}catch(e){console.log('ERR  — '+l+' :: '+e.message)}};

// all scenarios render clean
const keys=await pg.evaluate(()=>Object.keys(SC));
let bad=[];
for(const k of keys){ await pg.evaluate(x=>loadScenario(x),k); await pg.waitForTimeout(110);
  const t=await pg.locator('main').innerText();
  if(/undefined|NaN|\[object/.test(t)) bad.push(k); }
console.log(`scenarios rendered: ${keys.length}, broken: ${bad.length?bad.join(','):'none'}\n`);

await pg.evaluate(()=>loadScenario('default')); await pg.waitForTimeout(150);
await A('structure: 3 cards matching real screen', async()=> (await pg.locator('.card').count())===3);
await A('S1 heading matches production', async()=> (await pg.locator('.card h2').first().innerText()).includes('من أين ستنطلق شحناتك'));
await A('S3 heading is the promise section', async()=> (await pg.locator('.card h2').nth(2).innerText()).includes('وعد التوصيل لعملائك'));
await A('branch chips render', async()=> (await pg.locator('.tagsin .chip').count())===3);
await A('بوليصات سلة default-selected', async()=> (await pg.locator('.opt.on').innerText()).includes('بوليصات سلة'));
await A('no Tayaar card on default', async()=> (await pg.locator('.ty').count())===0);
await A('no readiness on default', async()=> (await pg.locator('.ready').count())===0);

// pick توصيل خاص
await pg.locator('.opt').nth(1).click(); await pg.waitForTimeout(200);
await A('توصيل خاص reveals sub-provider select', async()=> await pg.locator('select[data-ch="sub"]').isVisible());
await A('per-branch toggle present', async()=> (await pg.locator('[data-act="per-branch"]').count())===1);
await A('still NO Tayaar card before choosing مناديب', async()=> (await pg.locator('.ty').count())===0);

// external carrier → no card
await pg.selectOption('select[data-ch="sub"]','carrier'); await pg.waitForTimeout(200);
await A('شركة شحن خارجية → no cross-sell (correct trigger)', async()=> (await pg.locator('.ty').count())===0);

// own couriers → ST1 fires
await pg.selectOption('select[data-ch="sub"]','own'); await pg.waitForTimeout(220);
await A('ST1 مناديب متجري → readiness fires', async()=> (await pg.locator('.ready').count())===1);
await A('ST1 three requirements unmet', async()=> (await pg.locator('.req.unmet').count())===3);
await A('ST1 Tayaar card shown', async()=> (await pg.locator('.ty').count())===1);
await A('ST1 no statistics in card', async()=>{const t=await pg.locator('.ty').innerText();
  return !/\d+\s*%/.test(t)||('percent: '+t.match(/\d+\s*%/)[0]);});
await A('S3 promise section warns it will not show', async()=>
  (await pg.locator('.promise-note.bad').count())>=1);
await A('launch bar reflects no-badge', async()=>
  (await pg.locator('.launch').innerText()).includes('بدون وعد الساعتين'));

// كلاهما معًا also triggers
await pg.selectOption('select[data-ch="sub"]','both'); await pg.waitForTimeout(200);
await A('«كلاهما معًا» also triggers readiness', async()=> (await pg.locator('.ready').count())===1);
await pg.selectOption('select[data-ch="sub"]','own'); await pg.waitForTimeout(200);

// ST2
await pg.locator('[data-act="consent-open"]').click(); await pg.waitForTimeout(220);
await A('ST2 consent opens', async()=> await pg.locator('.modal').isVisible());
await A('ST2 activate disabled pre-consent', async()=> await pg.locator('[data-act="activate"]').isDisabled());
await A('ST2 discloses 48h + no auto-charge', async()=>{const t=await pg.locator('.modal').innerText();
  return t.includes('48 ساعة')&&t.includes('لن يُخصم');});
await pg.locator('[data-act="consent"]').click(); await pg.waitForTimeout(150);
await pg.locator('[data-act="activate"]').click(); await pg.waitForTimeout(2500);
await A('ST2 success', async()=> (await pg.locator('.modal').innerText()).includes('أسبوعك المجاني'));
await pg.locator('[data-act="close"]').first().click(); await pg.waitForTimeout(250);

// ST3
await A('ST3 requirements met', async()=> (await pg.locator('.req.met').count())===3);
await A('ST3 promise section flips positive', async()=> (await pg.locator('.promise-note.good').count())>=1);
await A('ST3 first-run tasks', async()=> (await pg.locator('.task').count())===3);
await A('ST3 launch bar reflects badge on', async()=>
  (await pg.locator('.launch').innerText()).includes('سيظهر لعملائك'));

console.log('\nPAGE ERRORS:', errs.length?errs.join('\n'):'none');
await b.close();
