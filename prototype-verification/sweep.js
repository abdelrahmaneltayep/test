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
  // the edit forms and the VAT reveal are text too — open them before measuring
  await p.click('[data-act="edit-branch"]');await p.click('[data-act="edit-address"]');await p.click('#has-vat');await p.waitForTimeout(300);
  const badc0=await p.evaluate(CONTRAST);badc0.length?(bad(`contrast ${dir}/verify(editing)`),badc0.slice(0,6).forEach(x=>console.log('       ',x.r+':1 need '+x.need,'|',x.sel,'|',x.txt))):ok(`contrast ${dir}/verify(editing)`);
  await p.click('[data-act="cancel-branch"]');await p.click('[data-act="cancel-address"]');await p.click('#has-vat');await p.waitForTimeout(200);
  await p.click('[data-act="place-order"]');await p.waitForTimeout(1400);
  for(const sc of ['verify','paid','why']){await p.evaluate(s=>location.hash=s,sc);await p.waitForTimeout(350);
   const badc=await p.evaluate(CONTRAST);badc.length?(bad(`contrast ${dir}/${sc}`),badc.slice(0,6).forEach(x=>console.log('       ',x.r+':1 need '+x.need,'|',x.sel,'|',x.txt))):ok(`contrast ${dir}/${sc}`);
   const ov=await p.evaluate(()=>document.documentElement.scrollWidth-document.documentElement.clientWidth);ov>1?bad(`overflow ${dir}/${sc} ${ov}px`):ok(`no overflow ${dir}/${sc}`)}
  errs.length?bad('page errors '+dir+': '+errs.join('; ')):ok('no page errors '+dir);await p.close()}
 const p=await b.newPage({viewport:{width:1440,height:1000}});await p.goto('file://'+__dirname+'/sweep.html');await p.waitForTimeout(500);
 const txt=async s=>await p.textContent(s);
 const T=[
  ['saved values render as text, not links',async()=>{const t=await txt('#sec-branch');return t.includes('Buyer')&&t.includes('908070605')&&t.includes('branch@highbaseco.com')&&!(await p.$('#sec-branch a'))}],
  ['edit details validates and saves',async()=>{await p.click('[data-act="edit-branch"]');await p.fill('#b-phone','12');await p.click('[data-act="save-branch"]');await p.waitForTimeout(150);
     if(!(await p.$('.hb-phonefield[data-state="error"]')))return false;await p.fill('#b-phone','39080705');await p.fill('#b-name','Buyer Bahrain');await p.click('[data-act="save-branch"]');await p.waitForTimeout(200);
     return (await txt('#sec-branch')).includes('Buyer Bahrain')&&!(await p.$('#b-name'))}],
  ['edit address: cancel restores',async()=>{await p.click('[data-act="edit-address"]');await p.fill('#a-city','Riffa');await p.click('[data-act="cancel-address"]');await p.waitForTimeout(150);return (await txt('#sec-address')).includes('Manama')&&!(await txt('#sec-address')).includes('Riffa')}],
  ['edit address: required error then update',async()=>{await p.click('[data-act="edit-address"]');await p.fill('#a-street','');await p.click('[data-act="save-address"]');await p.waitForTimeout(150);
     if(!(await p.$('#a-street'))||!(await txt('#sec-address')).includes('required'))return false;await p.fill('#a-street','2845');await p.click('[data-act="save-address"]');await p.waitForTimeout(200);return (await txt('#sec-address')).includes('2845')}],
  ['place order refuses while editing',async()=>{await p.click('[data-act="edit-branch"]');await p.click('[data-act="place-order"]');await p.waitForTimeout(300);const r=(await txt('#toasts')).includes('Save or cancel')&&await p.evaluate(()=>document.querySelector('#screen-paid').hidden);await p.click('[data-act="cancel-branch"]');return r}],
  ['wrong file type refused in the zone',async()=>{await p.click('[data-act="remove-doc"][data-doc="id"]');await p.waitForTimeout(150);await p.click('[data-act="remove-doc-go"]');await p.waitForTimeout(200);
     fs.writeFileSync(__dirname+'/tmp-bad.txt','nope');const [fc]=await Promise.all([p.waitForEvent('filechooser'),p.click('[data-drop="id"]')]);await fc.setFiles(__dirname+'/tmp-bad.txt');await p.waitForTimeout(200);
     return !!(await p.$('[data-drop="id"][data-state="error"]'))}],
  ['place order refuses with a required doc missing',async()=>{await p.click('[data-act="place-order"]');await p.waitForTimeout(300);return (await txt('#sec-docs')).includes('Still needed')&&await p.evaluate(()=>document.querySelector('#screen-paid').hidden)}],
  ['upload shows progress then the card',async()=>{fs.writeFileSync(__dirname+'/tmp-id.png',Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==','base64'));
     const [fc]=await Promise.all([p.waitForEvent('filechooser'),p.click('[data-drop="id"]')]);await fc.setFiles(__dirname+'/tmp-id.png');await p.waitForTimeout(200);
     const prog=!!(await p.$('.hb-upload[data-state="uploading"]'));await p.waitForTimeout(1100);return prog&&!!(await p.$('#sec-docs .doc__prev img'))&&(await txt('#sec-docs')).includes('tmp-id.png')}],
  ['VAT checkbox reveals tax number + zone, and gates the order',async()=>{await p.click('#has-vat');await p.waitForTimeout(150);if(!(await p.$('#tax-no'))||!(await p.$('[data-drop="vat"]')))return false;
     await p.click('[data-act="place-order"]');await p.waitForTimeout(300);const gated=(await txt('#sec-docs')).includes('tax number')||(await txt('#sec-docs')).includes('VAT Certificate');await p.click('#has-vat');return gated}],
  ['place order succeeds and the paid page keeps the address',async()=>{await p.click('[data-act="place-order"]');await p.waitForTimeout(1500);const t=await txt('#screen-paid');return await p.evaluate(()=>!document.querySelector('#screen-paid').hidden)&&t.includes('Street 2845')&&t.includes('Manama')}],
  ['compact 390: no overflow',async()=>{await p.evaluate(()=>location.hash='verify');await p.setViewportSize({width:390,height:844});await p.waitForTimeout(300);const r=await p.evaluate(()=>document.documentElement.scrollWidth-document.documentElement.clientWidth);await p.screenshot({path:'v-compact.png',fullPage:false});await p.setViewportSize({width:1440,height:1000});return r<=1}],
 ];
 for(const [n,f] of T){let r=false,e=null;try{r=await f()}catch(x){e=x.message}r?ok(n):bad(n+(e?' — '+e.slice(0,140):''))}
 await b.close();console.log(fail?`\n${fail} FAILURE(S)`:'\nsweep clean');process.exit(fail?1:0)})();
