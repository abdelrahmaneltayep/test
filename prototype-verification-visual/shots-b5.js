require('./wrap.js');const {chromium}=require('playwright');
const EXE='/opt/pw-browsers/chromium_headless_shell-1194/chrome-linux/headless_shell';
(async()=>{const b=await chromium.launch({executablePath:EXE});const p=await b.newPage({viewport:{width:1440,height:1100}});
 const errs=[];p.on('pageerror',e=>errs.push(e.message));
 await p.goto('file://'+__dirname+'/sweep.html');await p.waitForTimeout(700);
 await p.evaluate(()=>location.hash='b');await p.waitForTimeout(400);
 for(const s of ['grid','rows','used','chips','table']){
   await p.click('[data-act="preview-style"][data-preview="'+s+'"]');await p.waitForTimeout(350);
   await p.screenshot({path:'v-b-'+s+'.png',fullPage:true});
 }
 console.log('errors:',errs.length?errs:'none');await b.close()})();
