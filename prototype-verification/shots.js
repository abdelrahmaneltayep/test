require('./wrap.js');const {chromium}=require('playwright');
const EXE='/opt/pw-browsers/chromium_headless_shell-1194/chrome-linux/headless_shell';
(async()=>{const b=await chromium.launch({executablePath:EXE});const p=await b.newPage({viewport:{width:1440,height:1100}});
 await p.goto('file://'+__dirname+'/sweep.html');await p.waitForTimeout(700);
 await p.screenshot({path:'v-verify.png',fullPage:true});
 await p.click('[data-act="edit-branch"]');await p.click('[data-act="edit-address"]');await p.click('#has-vat');await p.waitForTimeout(300);
 await p.screenshot({path:'v-editing.png',fullPage:true});
 await b.close();console.log('shots')})();
