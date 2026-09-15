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
     return pressed.join()==='activity'&&pills===0&&t.includes('Branch details saved')&&t.includes('Map pin updated')}],
  ['B: a replaced document shows the file it replaced beside the new one',async()=>{
     const before=await p.$$('#screen-b #card-docs .bafile[data-old]');
     const both=await p.$$('#screen-b #card-docs .bafile');
     const t=await txt('#screen-b #card-docs');
     return before.length===1&&both.length===2&&t.includes('Commercial License (CR) replaced')&&t.includes('CR-5056050560-1-2024.pdf')&&t.includes('Before')&&t.includes('After')}],
  ['B: replacing a file adds its own before and after',async()=>{
     fs.writeFileSync(__dirname+'/tmp-id.png',Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==','base64'));
     await p.click('#screen-b [data-act="open-drawer"][data-drawer="docs"]');await p.waitForTimeout(350);
     const [fc]=await Promise.all([p.waitForEvent('filechooser'),p.click('dialog.hb-drawer-layer [data-act="pick-doc"][data-doc="id"]')]);
     await fc.setFiles(__dirname+'/tmp-id.png');await p.waitForTimeout(1400);
     await p.click('dialog.hb-drawer-layer [data-act="close-drawer"]');await p.waitForTimeout(400);
     const t=await txt('#screen-b #card-docs');
     /* only the newest replacement opens out; the older one falls back to a single line */
     return (await p.$$('#screen-b #card-docs .bafile[data-old]')).length===1&&t.includes('Personal ID Document replaced')&&t.includes('CPR-front.jpg')&&t.includes('tmp-id.png')&&t.includes('replaced CR-5056050560-1-2024.pdf')}],
  ['B: every document is tagged Required or Optional, and the tag is not a status pill',async()=>{
     const tags=await p.$$eval('#screen-b #card-docs .hb-chip',e=>e.map(x=>x.textContent.trim()));
     const pills=(await p.$$('#screen-b #card-docs .hb-status')).length;
     return tags.length===2&&tags.every(t=>t==='Required')&&pills===0}],
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
  ['B: VAT is a link until asked for',async()=>{await p.click('#screen-b [data-act="open-drawer"][data-drawer="docs"]');await p.waitForTimeout(300);
     const link=!!(await p.$('dialog.hb-drawer-layer [data-act="show-vat"]'));await p.click('dialog.hb-drawer-layer [data-act="show-vat"]');await p.waitForTimeout(250);
     const shown=!!(await p.$('dialog.hb-drawer-layer #tax-no'));await p.click('dialog.hb-drawer-layer #has-vat');await p.waitForTimeout(250);
     await p.click('dialog.hb-drawer-layer [data-act="close-drawer"]');await p.waitForTimeout(250);return link&&shown}],
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
