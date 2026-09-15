require('./wrap.js');const {chromium}=require('playwright');
const EXE='/opt/pw-browsers/chromium_headless_shell-1194/chrome-linux/headless_shell';
(async()=>{const b=await chromium.launch({executablePath:EXE});const p=await b.newPage({viewport:{width:1440,height:1000}});
 const errs=[];p.on('pageerror',e=>errs.push(e.message));
 await p.goto('file://'+__dirname+'/sweep.html');await p.waitForTimeout(700);await p.click('#t-notes');
 for(const v of ['d','e','why']){await p.evaluate(s=>location.hash=s,v);await p.waitForTimeout(400);await p.screenshot({path:'v-'+v+'.png',fullPage:true});}
 // E with something missing, to show the exception state
 await p.evaluate(()=>location.hash='e');await p.click('[data-act="expand-row"][data-row="docs"]');await p.waitForTimeout(250);
 await p.click('#screen-e [data-act="remove-doc"][data-doc="cr"]');await p.waitForTimeout(200);await p.click('[data-act="remove-doc-go"]');await p.waitForTimeout(300);
 await p.click('[data-act="expand-row"][data-row="docs"]');await p.waitForTimeout(250);
 await p.screenshot({path:'v-e-todo.png',fullPage:true});
 console.log('errors:',errs.length?errs:'none');await b.close()})();
