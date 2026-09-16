require('./wrap.js');const {chromium}=require('playwright');const fs=require('fs');
const EXE='/opt/pw-browsers/chromium_headless_shell-1194/chrome-linux/headless_shell';
const CONTRAST=`(()=>{const lum=c=>{const [r,g,b]=c.map(v=>{v/=255;return v<=.03928?v/12.92:Math.pow((v+.055)/1.055,2.4)});return .2126*r+.7152*g+.0722*b};
 const parse=s=>{const m=s.match(/rgba?\\(([^)]+)\\)/);if(!m)return null;const p=m[1].split(/[,\\s\\/]+/).map(Number);return {rgb:p.slice(0,3),a:p.length>3?p[3]:1}};
 const bgOf=el=>{let n=el;while(n&&n.nodeType===1){const c=parse(getComputedStyle(n).backgroundColor);if(c&&c.a>.95)return c.rgb;n=n.parentElement}return [255,255,255]};
 const ratio=(a,b)=>{const l1=lum(a),l2=lum(b);return (Math.max(l1,l2)+.05)/(Math.min(l1,l2)+.05)};const out=[];
 document.querySelectorAll('*').forEach(el=>{if(el.closest('[hidden]')||el.closest('#toasts')||el.closest('details:not([open])')||(el.offsetParent===null&&getComputedStyle(el).position!=='fixed'))return;
  const txt=[...el.childNodes].filter(n=>n.nodeType===3&&n.textContent.trim()).map(n=>n.textContent.trim()).join(' ');if(!txt)return;
  const cs=getComputedStyle(el);if(cs.visibility==='hidden'||cs.opacity==='0')return;const fg=parse(cs.color);if(!fg||fg.a<.5)return;
  const size=parseFloat(cs.fontSize),w=parseInt(cs.fontWeight)||400;const large=size>=24||(size>=18.66&&w>=700);const r=ratio(fg.rgb,bgOf(el));const need=large?3:4.5;
  if(r<need)out.push({r:+r.toFixed(2),need,sel:(''+el.className).slice(0,50)||el.tagName,txt:txt.slice(0,50)})});return out})()`;
(async()=>{const b=await chromium.launch({executablePath:EXE});let fail=0;const ok=m=>console.log('  ok   '+m),bad=m=>{console.log('  FAIL '+m);fail++};
 for(const dir of ['ltr','rtl']){const p=await b.newPage({viewport:{width:1440,height:1000}});const errs=[];p.on('pageerror',e=>errs.push(e.message));
  await p.goto('file://'+__dirname+'/sweep.html');await p.waitForTimeout(500);if(dir==='rtl'){await p.click('#t-dir');await p.waitForTimeout(300)}
  for(const sc of ['a','b','c','why']){await p.evaluate(s=>location.hash=s,sc);await p.waitForTimeout(300);
   if(sc==='a'){await p.click('#screen-a [data-act="open-qr"]');await p.waitForTimeout(300);
     const q=await p.evaluate(CONTRAST);q.length?(bad(`contrast ${dir}/a+qr`),q.slice(0,4).forEach(x=>console.log('       ',x.r+':1 need '+x.need,'|',x.sel,'|',x.txt))):ok(`contrast ${dir}/a+qr`);
     await p.click('dialog.hb-drawer-layer [data-act="close-drawer"]');await p.waitForTimeout(250)}
   if(sc==='c'){await p.click('#screen-c [data-act="pay-tab"][data-tab="qr"]');await p.waitForTimeout(250);
     const q=await p.evaluate(CONTRAST);q.length?(bad(`contrast ${dir}/c+qr`),q.slice(0,4).forEach(x=>console.log('       ',x.r+':1 need '+x.need,'|',x.sel,'|',x.txt))):ok(`contrast ${dir}/c+qr`);
     await p.click('#screen-c [data-act="pay-tab"][data-tab="bank"]');await p.waitForTimeout(200)}
   const badc=await p.evaluate(CONTRAST);badc.length?(bad(`contrast ${dir}/${sc}`),badc.slice(0,6).forEach(x=>console.log('       ',x.r+':1 need '+x.need,'|',x.sel,'|',x.txt))):ok(`contrast ${dir}/${sc}`);
   const ov=await p.evaluate(()=>document.documentElement.scrollWidth-document.documentElement.clientWidth);ov>1?bad(`overflow ${dir}/${sc} ${ov}px`):ok(`no overflow ${dir}/${sc}`)}
  errs.length?bad('page errors '+dir+': '+errs.join('; ')):ok('no page errors '+dir);await p.close()}

 const p=await b.newPage({viewport:{width:1440,height:1000}});await p.goto('file://'+__dirname+'/sweep.html');await p.waitForTimeout(500);
 const txt=async s=>await p.textContent(s);
 const png='iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==';
 const T=[
  ['every version leads with the amount, and it is the largest type on the page',async()=>{
     let okk=true;
     for(const v of ['a','b','c']){await p.evaluate(s=>location.hash=s,v);await p.waitForTimeout(300);
       const amt=await p.$('#screen-'+v+' .amount .hb-headline-lg');
       if(!amt){okk=false;continue}
       const size=await p.evaluate(el=>parseFloat(getComputedStyle(el).fontSize),amt);
       const others=await p.$$eval('#screen-'+v+' .pay :is(h1,h2,span,p,dd)',els=>els.map(e=>parseFloat(getComputedStyle(e).fontSize)));
       if(size<Math.max.apply(null,others))okk=false;
       if(!(await txt('#screen-'+v)).includes('BHD 12.755'))okk=false}
     return okk}],
  ['every version copies the IBAN, the amount and all of it at once',async()=>{
     let okk=true;
     for(const v of ['a','b','c']){await p.evaluate(s=>location.hash=s,v);await p.waitForTimeout(250);
       const labels=await p.$$eval('#screen-'+v+' [data-act="copy"]',e=>e.map(x=>x.dataset.label));
       if(!(labels.indexOf('iban')>=0&&labels.indexOf('amount')>=0&&labels.indexOf('bank details')>=0))okk=false}
     return okk}],
  ['A: the QR is on the page as a tile, and enlarges into the Drawer',async()=>{
     await p.evaluate(()=>location.hash='a');await p.waitForTimeout(300);
     /* present, but a corner of the amount block rather than a column */
     const tile=await p.$('#screen-a .amount .qrmini');
     const box=tile?await tile.boundingBox():null;
     const columns=(await p.$$('#screen-a .qr')).length;
     const cap=await txt('#screen-a .qrmini');
     await p.click('#screen-a [data-act="open-qr"]');await p.waitForTimeout(300);
     const open=await p.evaluate(()=>document.querySelector('dialog.hb-drawer-layer').open);
     const t=await txt('dialog.hb-drawer-layer');
     await p.click('dialog.hb-drawer-layer [data-act="close-drawer"]');await p.waitForTimeout(250);
     const closed=!(await p.evaluate(()=>document.querySelector('dialog.hb-drawer-layer').open));
     return !!tile&&columns===0&&box.width<160&&cap.includes('Scan to pay')&&open&&closed&&t.includes('Pay by QR')&&t.includes('placeholder')}],
  ['A: marking the transfer moves the page on to the receipt',async()=>{
     await p.click('#screen-a [data-act="mark-transferred"]');await p.waitForTimeout(300);
     const t=await txt('#screen-a');
     return t.includes('Send us the receipt')&&t.includes('Waiting for your receipt')&&!!(await p.$('#screen-a [data-drop="receipt"]'))}],
  ['A: uploading the receipt finishes the job on the page itself',async()=>{
     fs.writeFileSync(__dirname+'/tmp-receipt.png',Buffer.from(png,'base64'));
     const [fc]=await Promise.all([p.waitForEvent('filechooser'),p.click('#screen-a [data-drop="receipt"]')]);
     await fc.setFiles(__dirname+'/tmp-receipt.png');await p.waitForTimeout(200);
     const prog=!!(await p.$('#screen-a .hb-upload[data-state="uploading"]'));await p.waitForTimeout(1100);
     const card=!!(await p.$('#screen-a .hb-upload[data-state="uploaded"]'));
     const t=await txt('#screen-a');
     return prog&&card&&t.includes('Receipt received')&&t.includes('Payment under review')}],
  ['the receipt, and the state it puts the order in, is the same in all three',async()=>{
     let okk=true;
     for(const v of ['b','c']){await p.evaluate(s=>location.hash=s,v);await p.waitForTimeout(300);
       const t=await txt('#screen-'+v);
       if(!(t.includes('Payment under review')&&t.includes('tmp-receipt.png')))okk=false}
     return okk}],
  ['removing the receipt asks first, and puts the page back',async()=>{
     await p.evaluate(()=>location.hash='a');await p.waitForTimeout(300);
     await p.click('#screen-a [data-act="remove-receipt"]');await p.waitForTimeout(250);
     const asked=await p.evaluate(()=>document.querySelector('dialog.proto-confirm').open);
     await p.click('[data-act="remove-receipt-go"]');await p.waitForTimeout(300);
     const back=!!(await p.$('#screen-a [data-drop="receipt"]'));
     return asked&&back&&!(await txt('#screen-a')).includes('Payment under review')}],
  ['B: one step is open at a time, and a later step refuses to open early',async()=>{
     await p.reload();await p.waitForTimeout(600);
     await p.evaluate(()=>location.hash='b');await p.waitForTimeout(350);
     const open=await p.$$('#screen-b .step[data-open]');
     const which=await p.$eval('#screen-b .step[data-open]',e=>e.id);
     await p.click('#screen-b [data-act="open-step"][data-step="4"]');await p.waitForTimeout(250);
     const still=await p.$eval('#screen-b .step[data-open]',e=>e.id);
     await p.click('#screen-b [data-act="open-step"][data-step="1"]');await p.waitForTimeout(250);
     const moved=await p.$eval('#screen-b .step[data-open]',e=>e.id);
     /* a fresh page opens on the live step: the transfer */
     return open.length===1&&which==='step-2'&&still==='step-2'&&moved==='step-1'}],
  ['B: the steps carry the work — amount in 2, upload in 3',async()=>{
     await p.click('#screen-b [data-act="open-step"][data-step="2"]');await p.waitForTimeout(250);
     const two=!!(await p.$('#screen-b #step-2 .amount'))&&!!(await p.$('#screen-b #step-2 [data-act="copy"]'));
     await p.click('#screen-b [data-act="mark-transferred"]');await p.waitForTimeout(300);
     const three=!!(await p.$('#screen-b #step-3 [data-drop="receipt"]'));
     return two&&three}],
  ['C: bank and QR are two tabs, not two columns',async()=>{
     await p.evaluate(()=>location.hash='c');await p.waitForTimeout(300);
     const bank=!!(await p.$('#screen-c .copyrows'))&&(await p.$$('#screen-c .qr')).length===0;
     await p.click('#screen-c [data-act="pay-tab"][data-tab="qr"]');await p.waitForTimeout(250);
     const qr=(await p.$$('#screen-c .qr')).length===1&&(await p.$$('#screen-c .copyrows')).length===0;
     await p.click('#screen-c [data-act="pay-tab"][data-tab="bank"]');await p.waitForTimeout(200);
     return bank&&qr}],
  ['C: both halves and the tracker are on screen at once',async()=>{
     const panels=(await p.$$('#screen-c .two > .panel')).length;
     const steps=(await p.$$('#screen-c .track li')).length;
     const t=await txt('#screen-c');
     return panels===2&&steps===4&&t.includes('1 · Pay')&&t.includes('2 · Prove')&&!!(await p.$('#screen-c [data-drop="receipt"]'))}],
  ['a refused file is refused in the zone, not only in a toast',async()=>{
     fs.writeFileSync(__dirname+'/tmp-bad.txt','not a receipt');
     const [fc]=await Promise.all([p.waitForEvent('filechooser'),p.click('#screen-c [data-drop="receipt"]')]);
     await fc.setFiles(__dirname+'/tmp-bad.txt');await p.waitForTimeout(400);
     const zone=await p.$('#screen-c .hb-upload[data-state="error"]');
     const t=await txt('#screen-c .hb-upload[data-state="error"]');
     return !!zone&&t.includes('Only PDF, JPG or PNG')}],
  ['Compare: three versions, each opening its own screen',async()=>{
     await p.evaluate(()=>location.hash='why');await p.waitForTimeout(300);
     const n=(await p.$$('#screen-why [data-act="goto"]')).length;
     await p.click('#screen-why [data-act="goto"][data-screen="c"]');await p.waitForTimeout(300);
     const onC=!(await p.$('#screen-c')).evaluate?false:await p.evaluate(()=>!document.querySelector('#screen-c').hidden);
     return n===3&&onC}],
  ['compact 390: no overflow in any version',async()=>{await p.setViewportSize({width:390,height:844});let okk=true;
     for(const v of ['a','b','c','why']){await p.evaluate(s=>location.hash=s,v);await p.waitForTimeout(300);
       const r=await p.evaluate(()=>document.documentElement.scrollWidth-document.documentElement.clientWidth);
       if(r>1){okk=false;console.log('       overflow',v,r)}}
     await p.setViewportSize({width:1440,height:1000});return okk}]
 ];
 for(const [n,f] of T){let r=false,e=null;try{r=await f()}catch(x){e=x.message}r?ok(n):bad(n+(e?' — '+e.slice(0,140):''))}
 await b.close();console.log(fail?`\n${fail} FAILURE(S)`:'\nsweep clean');process.exit(fail?1:0)})();
