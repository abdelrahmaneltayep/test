require('./wrap.js');const {chromium}=require('playwright');
const EXE='/opt/pw-browsers/chromium_headless_shell-1194/chrome-linux/headless_shell';
(async()=>{const b=await chromium.launch({executablePath:EXE});const p=await b.newPage({viewport:{width:1440,height:1000}});
 const errs=[];p.on('pageerror',e=>errs.push(e.message));
 await p.goto('file://'+__dirname+'/sweep.html');await p.waitForTimeout(700);await p.click('#t-notes');
 for(const v of ['a','b','c','why']){await p.evaluate(s=>location.hash=s,v);await p.waitForTimeout(400);await p.screenshot({path:'v-'+v+'.png',fullPage:true});}
 await p.evaluate(()=>location.hash='b');await p.click('[data-act="toggle-card"][data-card="docs"]');await p.waitForTimeout(300);await p.screenshot({path:'v-b-open.png',fullPage:true});
 await p.evaluate(()=>location.hash='c');await p.click('[data-act="go-step"][data-step="3"]');await p.waitForTimeout(300);await p.screenshot({path:'v-c-review.png',fullPage:true});
 console.log('errors:',errs.length?errs:'none');await b.close()})();
