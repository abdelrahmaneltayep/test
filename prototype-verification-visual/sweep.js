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
   if(sc==='b'){for(const st of ['grid','rows','used','chips','table','cred','tiles','stats','options','receipt','list','ledger','activity','actions','grouped']){await p.click('[data-act="preview-style"][data-preview="'+st+'"]');await p.waitForTimeout(250);
     const badp=await p.evaluate(CONTRAST);if(badp.length){bad(`contrast ${dir}/preview:${st}`);badp.slice(0,4).forEach(x=>console.log('       ',x.r+':1 need '+x.need,'|',x.sel,'|',x.txt))}else ok(`contrast ${dir}/preview:${st}`);
     const ovp=await p.evaluate(()=>document.documentElement.scrollWidth-document.documentElement.clientWidth);ovp>1?bad(`overflow ${dir}/preview:${st} ${ovp}px`):ok(`no overflow ${dir}/preview:${st}`)}
    await p.click('[data-act="preview-style"][data-preview="grid"]');await p.waitForTimeout(200);
    for(const c of ['branch','address','docs']){await p.click('[data-act="open-drawer"][data-drawer="'+c+'"]');await p.waitForTimeout(250);
     const bad2=await p.evaluate(CONTRAST);if(bad2.length){bad(`contrast ${dir}/drawer:${c}`);bad2.slice(0,4).forEach(x=>console.log('       ',x.r+':1 need '+x.need,'|',x.sel,'|',x.txt))}else ok(`contrast ${dir}/drawer:${c}`);
     await p.click('.hb-drawer__close button');await p.waitForTimeout(200)}}
   const badc=await p.evaluate(CONTRAST);badc.length?(bad(`contrast ${dir}/${sc}`),badc.slice(0,6).forEach(x=>console.log('       ',x.r+':1 need '+x.need,'|',x.sel,'|',x.txt))):ok(`contrast ${dir}/${sc}`);
   const ov=await p.evaluate(()=>document.documentElement.scrollWidth-document.documentElement.clientWidth);ov>1?bad(`overflow ${dir}/${sc} ${ov}px`):ok(`no overflow ${dir}/${sc}`)}
  errs.length?bad('page errors '+dir+': '+errs.join('; ')):ok('no page errors '+dir);await p.close()}
 const p=await b.newPage({viewport:{width:1440,height:1000}});await p.goto('file://'+__dirname+'/sweep.html');await p.waitForTimeout(500);
 const txt=async s=>await p.textContent(s);
 const T=[
  ['A: one section open, summaries on the rest',async()=>{const n=await p.$$('#screen-a .acc__item[data-state="now"]');const s=await p.$$('#screen-a .acc__summary');return n.length===1&&s.length===2}],
  ['A: confirm & continue walks the accordion',async()=>{await p.click('#screen-a [data-act="next-step"]');await p.waitForTimeout(200);return !!(await p.$('#screen-a #acc-address[data-state="now"]'))&&!!(await p.$('#screen-a #acc-branch[data-state="done"]'))}],
  ['A: edit inside a step validates',async()=>{await p.click('#screen-a [data-act="edit-address"]');await p.fill('#screen-a #a-city','');await p.click('#screen-a [data-act="save-address"]');await p.waitForTimeout(150);const e=!!(await p.$('#screen-a .hb-field[data-state="error"]'));await p.fill('#screen-a #a-city','Manama');await p.click('#screen-a [data-act="save-address"]');await p.waitForTimeout(150);return e&&!(await p.$('#screen-a #a-city'))}],
  ['B: previews are structured data, not a sentence',async()=>{await p.evaluate(()=>location.hash='b');await p.waitForTimeout(300);
     await p.click('#screen-b [data-act="preview-style"][data-preview="grid"]');await p.waitForTimeout(250);
     const facts=await p.$$('#screen-b .fact');const tiles=await p.$$('#screen-b .doctile');const forms=await p.$$('#screen-b input:not([type=checkbox])');
     const t=await txt('#screen-b');
     return facts.length===12&&tiles.length===2&&forms.length===0&&t.includes('Branch Phone')&&t.includes('ZIP / Postal Code')&&t.includes('CR Number')}],
  ['B: fifteen preview styles, same data, none of them a form',async()=>{
     const seen={};
     for(const st of ['grid','rows','used','chips','table','cred','tiles','stats','options','receipt','list','ledger','activity','actions','grouped']){
       await p.click('#screen-b [data-act="preview-style"][data-preview="'+st+'"]');await p.waitForTimeout(250);
       const pressed=await p.$$eval('#screen-b [data-act="preview-style"]',e=>e.filter(x=>x.getAttribute('aria-pressed')==='true').map(x=>x.dataset.preview));
       const t=await txt('#screen-b');
       const forms=await p.$$('#screen-b input:not([type=checkbox]), #screen-b select, #screen-b textarea');
       seen[st]=pressed.join()===st&&forms.length===0&&t.includes('Manama')&&t.includes('908070605')&&t.includes('5056050560-1');
     }
     const marks={grid:'.prev__facts',rows:'.prows',used:'.pused',chips:'.pchips',table:'.prev__table',cred:'.pcred',tiles:'.ptiles',stats:'.pstats',options:'.popts',receipt:'.prcp',list:'.plist',ledger:'.pledger',activity:'.pactivity',actions:'.pactions',grouped:'.pgrouped'};
     let shapes=true;
     for(const st of ['grid','rows','used','chips','table','cred','tiles','stats','options','receipt','list','ledger','activity','actions','grouped']){
       await p.click('#screen-b [data-act="preview-style"][data-preview="'+st+'"]');await p.waitForTimeout(200);
       if(!(await p.$('#screen-b '+marks[st]))) shapes=false;
       for(const other of Object.keys(marks)) if(other!==st&&marks[other]!==marks[st]&&await p.$('#screen-b '+marks[other])) shapes=false;
     }
     await p.click('#screen-b [data-act="preview-style"][data-preview="grid"]');await p.waitForTimeout(200);
     return shapes&&Object.keys(seen).every(k=>seen[k])}],
  ['B: a missing document shows in every one of the fifteen styles',async()=>{
     await p.click('#screen-b [data-act="open-drawer"][data-drawer="docs"]');await p.waitForTimeout(300);
     await p.click('dialog.hb-drawer-layer [data-act="remove-doc"][data-doc="id"]');await p.waitForTimeout(200);
     await p.click('[data-act="remove-doc-go"]');await p.waitForTimeout(300);
     await p.click('dialog.hb-drawer-layer [data-act="close-drawer"]');await p.waitForTimeout(300);
     let flagged=true;
     for(const st of ['grid','rows','used','chips','table','cred','tiles','stats','options','receipt','list','ledger','activity','actions','grouped']){
       await p.click('#screen-b [data-act="preview-style"][data-preview="'+st+'"]');await p.waitForTimeout(220);
       const t=await txt('#screen-b #card-docs');
       if(!/Required|needed|Not uploaded|missing/.test(t)) flagged=false;
     }
     /* put it back so the tests that follow start from a complete account */
     await p.click('#screen-b [data-act="preview-style"][data-preview="grid"]');await p.waitForTimeout(200);
     await p.click('#screen-b [data-act="open-drawer"][data-drawer="docs"]');await p.waitForTimeout(300);
     const [fc]=await Promise.all([p.waitForEvent('filechooser'),p.click('dialog.hb-drawer-layer [data-drop="id"]')]);
     await fc.setFiles(__dirname+'/tmp-id.png');await p.waitForTimeout(1300);
     await p.click('dialog.hb-drawer-layer [data-act="close-drawer"]');await p.waitForTimeout(300);
     return flagged&&(await p.$$('#screen-b .doctile[data-state="todo"]')).length===0}],
  ['Compare: the fifteen previews are listed and open B in that style',async()=>{
     await p.evaluate(()=>location.hash='why');await p.waitForTimeout(300);
     const n=(await p.$$('#screen-why [data-act="goto-style"]')).length;
     await p.click('#screen-why [data-act="goto-style"][data-preview="table"]');await p.waitForTimeout(300);
     const onB=!!(await p.$('#screen-b .prev__table'));
     await p.click('#screen-b [data-act="preview-style"][data-preview="grid"]');await p.waitForTimeout(200);
     return n===15&&onB}],
  ['B opens on Activity, with no status pill anywhere on the page',async()=>{
     await p.evaluate(()=>location.hash='b');await p.waitForTimeout(300);
     await p.reload();await p.waitForTimeout(600);await p.evaluate(()=>location.hash='b');await p.waitForTimeout(400);
     const pressed=await p.$$eval('#screen-b [data-act="preview-style"]',e=>e.filter(x=>x.getAttribute('aria-pressed')==='true').map(x=>x.dataset.preview));
     const pills=(await p.$$('#screen-b .hb-status')).length;
     const t=await txt('#screen-b');
     return pressed.join()==='activity'&&pills===0&&t.includes('Branch name')&&t.includes('Branch phone')&&t.includes('Branch email')&&t.includes('Postal code')&&t.includes('Map pin')}],
  ['B: a required document is marked with a red asterisk, not a chip or a pill',async()=>{
     const chips=(await p.$$('#screen-b #card-docs .hb-chip')).length;
     const pills=(await p.$$('#screen-b #card-docs .hb-status')).length;
     const marks=await p.$$eval('#screen-b #card-docs .hb-field__req',e=>e.map(x=>({t:x.textContent.trim(),c:getComputedStyle(x).color})));
     const titles=await p.$$eval('#screen-b #card-docs .hb-li__title',e=>e.map(x=>x.textContent.trim()));
     const err=await p.evaluate(()=>getComputedStyle(document.documentElement).getPropertyValue('--hb-color-error').trim());
     const errRgb=await p.evaluate(h=>{const d=document.createElement('div');d.style.color=h;document.body.appendChild(d);
       const c=getComputedStyle(d).color;d.remove();return c},err);
     /* CR and ID carry the mark in both cases; VAT is optional and carries none */
     return chips===0&&pills===0&&marks.length===4&&marks.every(m=>m.t==='*'&&m.c===errRgb)
       &&titles.filter(t=>t==='Commercial License (CR) *').length===2
       &&titles.filter(t=>t==='VAT Certificate').length===2}],
  ['B: the before-upload case is not filled in, and says what is missing',async()=>{
     const cases=await p.$$eval('#screen-b #card-docs .pcase .hb-label-md',e=>e.map(x=>x.textContent.trim()));
     /* :first-of-type would match the first DIV sibling, which is the list above the cases */
     const beforeRows=await p.$$eval('#screen-b #card-docs .pcase',e=>Array.from(e[0].querySelectorAll('.hb-li')).map(x=>x.dataset.state||''));
     const row=await p.$('#screen-b #card-docs .pcase .hb-li[data-state="todo"]');
     const bg=await p.evaluate(el=>getComputedStyle(el).backgroundColor,row);
     const plain=await p.evaluate(()=>getComputedStyle(document.querySelector('#screen-b #card-docs .hb-li:not([data-state])')).backgroundColor);
     const t=await txt('#screen-b #card-docs');
     return cases.length===2&&cases[0]==='Before upload'&&beforeRows.length===3&&beforeRows.every(v=>v==='todo')
       &&bg===plain&&t.includes('Not uploaded')}],
  ['B: the three documents are shown in both states, and the after case carries the file',async()=>{
     const t=await txt('#screen-b #card-docs');
     const afterRows=await p.$$eval('#screen-b #card-docs .pcase',e=>Array.from(e[1].querySelectorAll('.hb-li')).map(x=>x.textContent.replace(/\s+/g,' ').trim()));
     const legacy=(await p.$$('#screen-b .bafile, #screen-b .ba')).length;
     return legacy===0&&afterRows.length===3
       &&t.includes('After upload')
       &&afterRows[0].includes('Commercial License (CR) *')&&afterRows[0].includes('Replaced · CR-5056050560-1.pdf')
       &&afterRows[1].includes('Personal ID Document *')&&afterRows[1].includes('Uploaded · CPR-front.jpg')
       &&afterRows[2].includes('VAT Certificate')&&afterRows[2].includes('Uploaded · vat-certificate.pdf')}],
  ['B: the order breakdown is open, not folded away',async()=>{
     const open=await p.evaluate(()=>document.querySelector('#screen-b .rail details.why').open);
     const t=await txt('#screen-b .rail');
     return open&&t.includes('VAT 10%')&&t.includes('ALMANAR2')}],
  ['B: no drawer until Change is pressed',async()=>{
     await p.click('#screen-b [data-act="preview-style"][data-preview="grid"]');await p.waitForTimeout(250);
     return !(await p.evaluate(()=>document.querySelector('dialog.hb-drawer-layer').open))}],
  ['B: Change opens the Drawer with that section only',async()=>{await p.click('#screen-b [data-act="open-drawer"][data-drawer="branch"]');await p.waitForTimeout(300);
     const open=await p.evaluate(()=>document.querySelector('dialog.hb-drawer-layer').open);
     const t=await txt('dialog.hb-drawer-layer');
     return open&&t.includes('Branch Details')&&t.includes('Branch Email')&&!t.includes('Postal Code')&&!!(await p.$('dialog.hb-drawer-layer #b-name'))}],
  ['B: the Drawer validates before saving',async()=>{await p.fill('dialog.hb-drawer-layer #b-phone','12');await p.click('dialog.hb-drawer-layer [data-act="save-branch"]');await p.waitForTimeout(250);
     const stillOpen=await p.evaluate(()=>document.querySelector('dialog.hb-drawer-layer').open);
     return stillOpen&&!!(await p.$('dialog.hb-drawer-layer .hb-phonefield[data-state="error"]'))}],
  ['B: saving closes the Drawer and updates the preview',async()=>{await p.fill('dialog.hb-drawer-layer #b-phone','39080705');await p.fill('dialog.hb-drawer-layer #b-name','Buyer Bahrain');
     await p.click('dialog.hb-drawer-layer [data-act="save-branch"]');await p.waitForTimeout(350);
     const closed=!(await p.evaluate(()=>document.querySelector('dialog.hb-drawer-layer').open));
     const t=await txt('#screen-b #card-branch');return closed&&t.includes('Buyer Bahrain')&&t.includes('39080705')}],
  ['B: Cancel discards and leaves the preview alone',async()=>{await p.click('#screen-b [data-act="open-drawer"][data-drawer="address"]');await p.waitForTimeout(300);
     await p.fill('dialog.hb-drawer-layer #a-city','Riffa');await p.click('dialog.hb-drawer-layer [data-act="close-drawer"]');await p.waitForTimeout(300);
     const t=await txt('#screen-b #card-address');return t.includes('Manama')&&!t.includes('Riffa')}],
  ['B: document tiles show state; Manage opens the docs Drawer',async()=>{await p.click('#screen-b [data-act="open-drawer"][data-drawer="docs"]');await p.waitForTimeout(300);
     const t=await txt('dialog.hb-drawer-layer');const cards=await p.$$eval('dialog.hb-drawer-layer .hb-upload',e=>e.map(x=>x.dataset.state));
     const tiles=await p.$$eval('#screen-b .doctile',e=>e.map(x=>x.dataset.state));
     return t.includes('Commercial License (CR)')&&t.includes('Personal ID Document')&&cards.join()==='uploaded,uploaded'&&tiles.join()==='done,done'}],
  ['B: removing a required doc turns its tile amber',async()=>{await p.click('dialog.hb-drawer-layer [data-act="remove-doc"][data-doc="id"]');await p.waitForTimeout(200);
     await p.click('[data-act="remove-doc-go"]');await p.waitForTimeout(350);
     const stillOpen=await p.evaluate(()=>document.querySelector('dialog.hb-drawer-layer').open);
     return stillOpen&&(await p.$$('#screen-b .doctile[data-state="todo"]')).length===1&&!!(await p.$('#screen-b .ready[data-state="warn"]'))}],
  ['B: uploading inside the Drawer refreshes it and the tile',async()=>{fs.writeFileSync(__dirname+'/tmp-id.png',Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==','base64'));
     const [fc]=await Promise.all([p.waitForEvent('filechooser'),p.click('dialog.hb-drawer-layer [data-drop="id"]')]);await fc.setFiles(__dirname+'/tmp-id.png');await p.waitForTimeout(200);
     const prog=!!(await p.$('dialog.hb-drawer-layer .hb-upload[data-state="uploading"]'));await p.waitForTimeout(1100);
     const drawerCard=!!(await p.$('dialog.hb-drawer-layer .hb-upload[data-state="uploaded"]'));
     await p.click('dialog.hb-drawer-layer [data-act="close-drawer"]');await p.waitForTimeout(250);
     return prog&&drawerCard&&(await p.$$('#screen-b .doctile[data-state="todo"]')).length===0&&!!(await p.$('#screen-b .doctile img'))}],
  ['B: previewing a file returns to the docs Drawer',async()=>{await p.click('#screen-b [data-act="open-drawer"][data-drawer="docs"]');await p.waitForTimeout(300);
     await p.click('dialog.hb-drawer-layer [data-act="view-doc"][data-doc="id"]');await p.waitForTimeout(300);
     const preview=(await txt('dialog.hb-drawer-layer')).includes('tmp-id.png')&&!!(await p.$('dialog.hb-drawer-layer img[alt="tmp-id.png"]'));
     await p.click('dialog.hb-drawer-layer [data-act="close-drawer"]');await p.waitForTimeout(350);
     const back=(await txt('dialog.hb-drawer-layer')).includes('Commercial License (CR)');
     await p.click('dialog.hb-drawer-layer [data-act="close-drawer"]');await p.waitForTimeout(250);
     return preview&&back}],
  ['B: VAT is a checkbox, and ticking it is what asks for the number and the certificate',async()=>{
     await p.click('#screen-b [data-act="open-drawer"][data-drawer="docs"]');await p.waitForTimeout(300);
     /* before: one line, nothing asked for, and no plus-link anywhere */
     const box=!!(await p.$('dialog.hb-drawer-layer #has-vat'));
     const checkedBefore=box?await p.$eval('dialog.hb-drawer-layer #has-vat',e=>e.checked):null;
     const noLink=(await p.$$('dialog.hb-drawer-layer [data-act="show-vat"], dialog.hb-drawer-layer .disclose')).length===0;
     const askedBefore=(await p.$$('dialog.hb-drawer-layer #tax-no, dialog.hb-drawer-layer [data-drop="vat"]')).length;
     const hint=(await txt('dialog.hb-drawer-layer')).includes('Only if you want to reclaim VAT');
     /* after: the tax number and the certificate zone, and the number takes focus */
     await p.click('dialog.hb-drawer-layer #has-vat');await p.waitForTimeout(300);
     const checkedAfter=await p.$eval('dialog.hb-drawer-layer #has-vat',e=>e.checked);
     const num=!!(await p.$('dialog.hb-drawer-layer #tax-no'));
     const zone=!!(await p.$('dialog.hb-drawer-layer [data-drop="vat"]'));
     const focused=await p.evaluate(()=>document.activeElement&&document.activeElement.id);
     /* and unticking puts it back */
     await p.click('dialog.hb-drawer-layer #has-vat');await p.waitForTimeout(300);
     const goneAgain=(await p.$$('dialog.hb-drawer-layer #tax-no, dialog.hb-drawer-layer [data-drop="vat"]')).length===0;
     await p.click('dialog.hb-drawer-layer [data-act="close-drawer"]');await p.waitForTimeout(250);
     return box&&checkedBefore===false&&noLink&&askedBefore===0&&hint&&checkedAfter&&num&&zone&&focused==='tax-no'&&goneAgain}],
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
  ['compact 390: no overflow in any of B\'s fifteen preview styles',async()=>{await p.setViewportSize({width:390,height:844});
     await p.evaluate(()=>location.hash='b');await p.waitForTimeout(300);let okk=true;
     for(const st of ['grid','rows','used','chips','table','cred','tiles','stats','options','receipt','list','ledger','activity','actions','grouped']){await p.click('#screen-b [data-act="preview-style"][data-preview="'+st+'"]');await p.waitForTimeout(250);
       const r=await p.evaluate(()=>document.documentElement.scrollWidth-document.documentElement.clientWidth);if(r>1){okk=false;console.log('       overflow',st,r)}}
     await p.click('#screen-b [data-act="preview-style"][data-preview="grid"]');await p.waitForTimeout(200);
     await p.setViewportSize({width:1440,height:1000});await p.waitForTimeout(200);return okk}],
  ['compact 390: no overflow in any version',async()=>{await p.setViewportSize({width:390,height:844});let okk=true;for(const v of ['a','b','c','d','e']){await p.evaluate(s=>location.hash=s,v);await p.waitForTimeout(250);const r=await p.evaluate(()=>document.documentElement.scrollWidth-document.documentElement.clientWidth);if(r>1){okk=false;console.log('       overflow',v,r)}}await p.evaluate(()=>location.hash='c');await p.screenshot({path:'v-compact-c.png'});await p.setViewportSize({width:1440,height:1000});return okk}],
 ];
 for(const [n,f] of T){let r=false,e=null;try{r=await f()}catch(x){e=x.message}r?ok(n):bad(n+(e?' — '+e.slice(0,140):''))}
 await b.close();console.log(fail?`\n${fail} FAILURE(S)`:'\nsweep clean');process.exit(fail?1:0)})();
