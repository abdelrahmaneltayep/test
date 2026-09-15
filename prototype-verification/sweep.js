require('./wrap.js');const {chromium}=require('playwright');const fs=require('fs');
const EXE='/opt/pw-browsers/chromium_headless_shell-1194/chrome-linux/headless_shell';
const CONTRAST=`(()=>{const lum=c=>{const [r,g,b]=c.map(v=>{v/=255;return v<=.03928?v/12.92:Math.pow((v+.055)/1.055,2.4)});return .2126*r+.7152*g+.0722*b};
 const parse=s=>{const m=s.match(/rgba?\\(([^)]+)\\)/);if(!m)return null;const p=m[1].split(/[,\\s\\/]+/).map(Number);return {rgb:p.slice(0,3),a:p.length>3?p[3]:1}};
 const bgOf=el=>{let n=el;while(n&&n.nodeType===1){const c=parse(getComputedStyle(n).backgroundColor);if(c&&c.a>.95)return c.rgb;n=n.parentElement}return [255,255,255]};
 const ratio=(a,b)=>{const l1=lum(a),l2=lum(b);return (Math.max(l1,l2)+.05)/(Math.min(l1,l2)+.05)};const out=[];
 document.querySelectorAll('*').forEach(el=>{if(el.closest('[hidden]')||el.closest('#toasts')||(el.offsetParent===null&&getComputedStyle(el).position!=='fixed'))return;
  const txt=[...el.childNodes].filter(n=>n.nodeType===3&&n.textContent.trim()).map(n=>n.textContent.trim()).join(' ');if(!txt)return;
  const cs=getComputedStyle(el);if(cs.visibility==='hidden'||cs.opacity==='0')return;const fg=parse(cs.color);if(!fg||fg.a<.5)return;
  const size=parseFloat(cs.fontSize),w=parseInt(cs.fontWeight)||400;const large=size>=24||(size>=18.66&&w>=700);const r=ratio(fg.rgb,bgOf(el));const need=large?3:4.5;
  if(r<need)out.push({r:+r.toFixed(2),need,sel:(''+el.className).slice(0,50)||el.tagName,txt:txt.slice(0,50)})});return out})()`;
(async()=>{const b=await chromium.launch({executablePath:EXE});let fail=0;const ok=m=>console.log('  ok   '+m),bad=m=>{console.log('  FAIL '+m);fail++};
 for(const dir of ['ltr','rtl']){const p=await b.newPage({viewport:{width:1440,height:1000}});const errs=[];p.on('pageerror',e=>errs.push(e.message));
  await p.goto('file://'+__dirname+'/sweep.html');await p.waitForTimeout(500);
  if(dir==='rtl'){await p.click('#t-dir');await p.waitForTimeout(300)}
  await p.click('[data-act="place-order"]');await p.waitForTimeout(1400);
  for(const sc of ['verify','paid','why']){await p.evaluate(s=>location.hash=s,sc);await p.waitForTimeout(350);
   const badc=await p.evaluate(CONTRAST);badc.length?(bad(`contrast ${dir}/${sc}`),badc.slice(0,6).forEach(x=>console.log('       ',x.r+':1 need '+x.need,'|',x.sel,'|',x.txt))):ok(`contrast ${dir}/${sc}`);
   const ov=await p.evaluate(()=>document.documentElement.scrollWidth-document.documentElement.clientWidth);ov>1?bad(`overflow ${dir}/${sc} ${ov}px`):ok(`no overflow ${dir}/${sc}`)}
  const fam=await p.evaluate(()=>getComputedStyle(document.querySelector('.hb-footer')).fontFamily);console.log('       font',dir,fam);
  errs.length?bad('page errors '+dir+': '+errs.join('; ')):ok('no page errors '+dir);await p.close()}
 const p=await b.newPage({viewport:{width:1440,height:1000}});await p.goto('file://'+__dirname+'/sweep.html');await p.waitForTimeout(500);
 const T=[
  ['verify shows dashboard footer',async()=>await p.getAttribute('.hb-footer','data-view')==='dashboard'],
  ['change branch drawer saves',async()=>{await p.click('[data-act="edit-branch"]');await p.waitForTimeout(200);await p.click('input[name="branch"][value="sitra"]');await p.click('[data-act="save-branch"]');await p.waitForTimeout(200);return (await p.textContent('#screen-verify')).includes('Sitra Cold Store')}],
  ['document upload via drawer + real file',async()=>{await p.click('[data-act="upload-doc"][data-doc="vat"]');await p.waitForTimeout(200);
     fs.writeFileSync(__dirname+'/tmp-vat.pdf','%PDF-1.4 test');const [fc]=await Promise.all([p.waitForEvent('filechooser'),p.click('[data-act="pick-doc"]')]);await fc.setFiles(__dirname+'/tmp-vat.pdf');await p.waitForTimeout(300);
     return (await p.textContent('#screen-verify')).includes('tmp-vat.pdf')}],
  ['scenario: stock change resolved in place',async()=>{await p.click('#t-scenario');await p.click('[data-act="place-order"]');await p.waitForTimeout(1400);
     const open=await p.evaluate(()=>document.querySelector('dialog.proto-confirm').open);if(!open)return false;await p.click('[data-act="conflict-reduce"]');await p.waitForTimeout(300);
     return await p.evaluate(()=>!document.querySelector('#screen-paid').hidden)&&(await p.textContent('#screen-paid')).includes('Case of 18 × 3')}],
  ['paid shows marketplace footer',async()=>await p.getAttribute('.hb-footer','data-view')==='marketplace'],
  ['copy reference toasts',async()=>{await p.click('[data-copy^="ORD-"]');await p.waitForTimeout(200);return (await p.textContent('#toasts')).includes('Copied ORD-')}],
  ['receipt upload, preview, submit advances timeline',async()=>{fs.writeFileSync(__dirname+'/tmp-r.png',Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==','base64'));
     const [fc]=await Promise.all([p.waitForEvent('filechooser'),p.click('#drop')]);await fc.setFiles(__dirname+'/tmp-r.png');await p.waitForTimeout(300);
     if(!(await p.$('.receipt-prev img')))return false;await p.click('[data-act="submit-receipt"]');await p.waitForTimeout(300);
     const t=await p.textContent('#screen-paid');return t.includes('Receipt received')&&t.includes('Under review')}],
  ['compact 390: no overflow, header compact',async()=>{await p.setViewportSize({width:390,height:844});await p.waitForTimeout(300);
     const r=await p.evaluate(()=>({ov:document.documentElement.scrollWidth-document.documentElement.clientWidth,size:document.querySelector('.hb-header').dataset.size,bar:getComputedStyle(document.querySelector('#screen-paid .commit-bar')||document.body).display}));
     await p.screenshot({path:'v-compact.png'});await p.setViewportSize({width:1440,height:1000});return r.ov<=1&&r.size==='compact'}],
 ];
 for(const [n,f] of T){let r=false,e=null;try{r=await f()}catch(x){e=x.message}r?ok(n):bad(n+(e?' — '+e.slice(0,120):''))}
 await b.close();console.log(fail?`\n${fail} FAILURE(S)`:'\nsweep clean');process.exit(fail?1:0)})();
