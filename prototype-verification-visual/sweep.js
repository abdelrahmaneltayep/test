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
  for(const sc of ['a','b','c','d','e','why']){await p.evaluate(s=>location.hash=s,sc);await p.waitForTimeout(300);
   if(sc==='b'){for(const c of ['branch','address','docs'])await p.click('[data-act="toggle-card"][data-card="'+c+'"]');await p.waitForTimeout(200)}
   const badc=await p.evaluate(CONTRAST);badc.length?(bad(`contrast ${dir}/${sc}`),badc.slice(0,6).forEach(x=>console.log('       ',x.r+':1 need '+x.need,'|',x.sel,'|',x.txt))):ok(`contrast ${dir}/${sc}`);
   const ov=await p.evaluate(()=>document.documentElement.scrollWidth-document.documentElement.clientWidth);ov>1?bad(`overflow ${dir}/${sc} ${ov}px`):ok(`no overflow ${dir}/${sc}`)}
  errs.length?bad('page errors '+dir+': '+errs.join('; ')):ok('no page errors '+dir);await p.close()}
 const p=await b.newPage({viewport:{width:1440,height:1000}});await p.goto('file://'+__dirname+'/sweep.html');await p.waitForTimeout(500);
 const txt=async s=>await p.textContent(s);
 const T=[
  ['A: one section open, summaries on the rest',async()=>{const n=await p.$$('#screen-a .acc__item[data-state="now"]');const s=await p.$$('#screen-a .acc__summary');return n.length===1&&s.length===2}],
  ['A: confirm & continue walks the accordion',async()=>{await p.click('#screen-a [data-act="next-step"]');await p.waitForTimeout(200);return !!(await p.$('#screen-a #acc-address[data-state="now"]'))&&!!(await p.$('#screen-a #acc-branch[data-state="done"]'))}],
  ['A: edit inside a step validates',async()=>{await p.click('#screen-a [data-act="edit-address"]');await p.fill('#screen-a #a-city','');await p.click('#screen-a [data-act="save-address"]');await p.waitForTimeout(150);const e=!!(await p.$('#screen-a .hb-field[data-state="error"]'));await p.fill('#screen-a #a-city','Manama');await p.click('#screen-a [data-act="save-address"]');await p.waitForTimeout(150);return e&&!(await p.$('#screen-a #a-city'))}],
  ['B: cards closed by default, banner says ready',async()=>{await p.evaluate(()=>location.hash='b');await p.waitForTimeout(300);return (await p.$$('#screen-b .card[data-open]')).length===0&&(await txt('#screen-b .ready')).includes('Everything is in place')}],
  ['B: Change opens the card; Done closes it',async()=>{await p.click('#screen-b [data-act="toggle-card"][data-card="branch"]');await p.waitForTimeout(150);const o=!!(await p.$('#screen-b #card-branch[data-open]'));await p.click('#screen-b [data-act="toggle-card"][data-card="branch"]');await p.waitForTimeout(150);return o&&!(await p.$('#screen-b #card-branch[data-open]'))}],
  ['B: VAT is a link until asked for',async()=>{await p.click('#screen-b [data-act="toggle-card"][data-card="docs"]');await p.waitForTimeout(150);const link=!!(await p.$('#screen-b [data-act="show-vat"]'));await p.click('#screen-b [data-act="show-vat"]');await p.waitForTimeout(150);const shown=!!(await p.$('#screen-b #tax-no'));await p.click('#screen-b #has-vat');await p.waitForTimeout(150);return link&&shown}],
  ['B: removing a required doc flips the banner',async()=>{await p.click('#screen-b [data-act="remove-doc"][data-doc="id"]');await p.waitForTimeout(150);await p.click('[data-act="remove-doc-go"]');await p.waitForTimeout(200);return !!(await p.$('#screen-b .ready[data-state="warn"]'))}],
  ['B: place order refuses and opens documents',async()=>{await p.click('#screen-b .rail [data-act="place-order"]');await p.waitForTimeout(300);return (await txt('#screen-b #card-docs')).includes('Still needed')}],
  ['upload in B shows progress then card',async()=>{fs.writeFileSync(__dirname+'/tmp-id.png',Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==','base64'));
     const [fc]=await Promise.all([p.waitForEvent('filechooser'),p.click('#screen-b [data-drop="id"]')]);await fc.setFiles(__dirname+'/tmp-id.png');await p.waitForTimeout(200);const prog=!!(await p.$('#screen-b .hb-upload[data-state="uploading"]'));await p.waitForTimeout(1100);return prog&&!!(await p.$('#screen-b .doc__prev img'))}],
  ['C: one step on screen, map beside it',async()=>{await p.evaluate(()=>location.hash='c');await p.waitForTimeout(300);return (await p.$$('#screen-c .guide__main')).length===1&&(await p.$$('#screen-c .guide__step')).length===4&&(await txt('#screen-c')).includes('Step 1 of 4')}],
  ['C: continue reaches the review with all lines',async()=>{for(let i=0;i<3;i++){await p.click('#screen-c [data-act="next-step"]');await p.waitForTimeout(150)}const t=await txt('#screen-c');return t.includes('Step 4 of 4')&&t.includes('Buyer')&&t.includes('Manama')&&t.includes('tmp-id.png')}],
  ['C: place order from review succeeds',async()=>{await p.click('#screen-c [data-act="place-order"]');await p.waitForTimeout(1400);return await p.evaluate(()=>document.querySelector('dialog.proto-confirm').open)&&(await txt('dialog.proto-confirm')).includes('Order placed')}],
  ['D: tabs, one pane, each with its own status',async()=>{
     // C's test leaves the Confirmation Dialog open, and a modal <dialog> swallows every click
     await p.evaluate(()=>{const d=document.querySelector('dialog.proto-confirm');if(d&&d.open)d.close()});
     await p.evaluate(()=>location.hash='d');await p.waitForTimeout(300);
     const tabs=await p.$$('#screen-d .hb-tab');const panes=await p.$$('#screen-d .tabpane');const sel=await p.$$('#screen-d .hb-tab[aria-selected="true"]');
     return tabs.length===3&&panes.length===1&&sel.length===1&&(await txt('#screen-d')).includes('Branch Details')}],
  ['D: any tab reachable in any order',async()=>{await p.click('#screen-d [data-act="go-tab"][data-step="2"]');await p.waitForTimeout(200);
     const onDocs=(await txt('#screen-d .tabpane__head')).includes('Business Documents');
     await p.click('#screen-d [data-act="go-tab"][data-step="1"]');await p.waitForTimeout(200);
     return onDocs&&(await txt('#screen-d .tabpane__head')).includes('Delivery Address')}],
  ['D: edit inside a tab validates and saves',async()=>{await p.click('#screen-d [data-act="edit-address"]');await p.fill('#screen-d #a-building','');await p.click('#screen-d [data-act="save-address"]');await p.waitForTimeout(150);
     const e=!!(await p.$('#screen-d .hb-field[data-state="error"]'));await p.fill('#screen-d #a-building','19');await p.click('#screen-d [data-act="save-address"]');await p.waitForTimeout(200);
     return e&&!(await p.$('#screen-d #a-building'))}],
  ['E: every row ticked, progress full, nothing is a form',async()=>{await p.evaluate(()=>location.hash='e');await p.waitForTimeout(300);
     const rows=await p.$$('#screen-e .list__item');const todo=await p.$$('#screen-e .list__item[data-state="todo"]');const inputs=await p.$$('#screen-e input:not([type=checkbox])');
     return rows.length===4&&todo.length===0&&inputs.length===0&&(await txt('#screen-e .progressbar')).includes('4 of 4 ready')}],
  ['E: expanding a row reveals its editor',async()=>{await p.click('#screen-e [data-act="expand-row"][data-row="branch"]');await p.waitForTimeout(200);
     const open=(await txt('#screen-e #row-branch')).includes('Edit Details');await p.click('#screen-e [data-act="expand-row"][data-row="branch"]');await p.waitForTimeout(150);
     return open&&!(await txt('#screen-e #row-branch')).includes('Edit Details')}],
  ['E: a missing document turns one row into work',async()=>{await p.click('#screen-e [data-act="expand-row"][data-row="docs"]');await p.waitForTimeout(200);
     await p.click('#screen-e [data-act="remove-doc"][data-doc="cr"]');await p.waitForTimeout(150);await p.click('[data-act="remove-doc-go"]');await p.waitForTimeout(250);
     const t=await txt('#screen-e');const todo=await p.$$('#screen-e .list__item[data-state="todo"]');
     return todo.length===1&&t.includes('3 of 4 ready')&&t.includes('1 thing left')}],
  ['E: place order refuses and points at the row',async()=>{await p.click('#screen-e .rail [data-act="place-order"]');await p.waitForTimeout(400);
     return (await txt('#screen-e #row-docs')).includes('Still needed')&&await p.evaluate(()=>!document.querySelector('dialog.proto-confirm').open)}],
  ['E: re-uploading it ticks the row again',async()=>{fs.writeFileSync(__dirname+'/tmp-cr.png',Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==','base64'));
     const [fc]=await Promise.all([p.waitForEvent('filechooser'),p.click('#screen-e [data-drop="cr"]')]);await fc.setFiles(__dirname+'/tmp-cr.png');await p.waitForTimeout(1200);
     return (await p.$$('#screen-e .list__item[data-state="todo"]')).length===0&&(await txt('#screen-e .progressbar')).includes('4 of 4 ready')}],
  ['compact 390: no overflow in any version',async()=>{await p.setViewportSize({width:390,height:844});let okk=true;for(const v of ['a','b','c','d','e']){await p.evaluate(s=>location.hash=s,v);await p.waitForTimeout(250);const r=await p.evaluate(()=>document.documentElement.scrollWidth-document.documentElement.clientWidth);if(r>1){okk=false;console.log('       overflow',v,r)}}await p.evaluate(()=>location.hash='c');await p.screenshot({path:'v-compact-c.png'});await p.setViewportSize({width:1440,height:1000});return okk}],
 ];
 for(const [n,f] of T){let r=false,e=null;try{r=await f()}catch(x){e=x.message}r?ok(n):bad(n+(e?' — '+e.slice(0,140):''))}
 await b.close();console.log(fail?`\n${fail} FAILURE(S)`:'\nsweep clean');process.exit(fail?1:0)})();
