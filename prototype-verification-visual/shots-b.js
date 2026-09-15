require('./wrap.js');const {chromium}=require('playwright');
const EXE='/opt/pw-browsers/chromium_headless_shell-1194/chrome-linux/headless_shell';
(async()=>{const b=await chromium.launch({executablePath:EXE});const p=await b.newPage({viewport:{width:1440,height:1000}});
 const errs=[];p.on('pageerror',e=>errs.push(e.message));
 await p.goto('file://'+__dirname+'/sweep.html');await p.waitForTimeout(700);
 await p.evaluate(()=>location.hash='b');await p.waitForTimeout(400);
 await p.screenshot({path:'v-b.png',fullPage:true});
 for(const c of ['branch','address','docs']){
   await p.click('#screen-b [data-act="open-drawer"][data-drawer="'+c+'"]');await p.waitForTimeout(400);
   await p.screenshot({path:'v-b-drawer-'+c+'.png'});
   await p.click('dialog.hb-drawer-layer .hb-drawer__close button');await p.waitForTimeout(300);
 }
 console.log('errors:',errs.length?errs:'none');await b.close()})();
