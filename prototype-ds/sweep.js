const fs=require('fs'),path=require('path');
require('./wrap.js');
const {chromium}=require('playwright');
const D=__dirname;
const EXE='/opt/pw-browsers/chromium_headless_shell-1194/chrome-linux/headless_shell';

// the artifact host wraps the file; build the same wrapper here so we test what ships
const frag=fs.readFileSync(__dirname+'/highbase-checkout-proposal.html','utf8');
const wrap=`<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<style>:root{color-scheme:light}body{margin:0;font:14px system-ui}img{max-width:100%}[hidden]{display:none!important}</style>
</head><body>${frag}</body></html>`;
const f=D+'/sweep.html'; fs.writeFileSync(f,wrap);

const CONTRAST=`(()=>{
  const lum=c=>{const [r,g,b]=c.map(v=>{v/=255;return v<=.03928?v/12.92:Math.pow((v+.055)/1.055,2.4)});return .2126*r+.7152*g+.0722*b};
  const parse=s=>{const m=s.match(/rgba?\\(([^)]+)\\)/);if(!m)return null;const p=m[1].split(/[,\\s\\/]+/).map(Number);
    return {rgb:p.slice(0,3),a:p.length>3?p[3]:1}};
  const bgOf=el=>{let n=el;while(n&&n.nodeType===1){const c=parse(getComputedStyle(n).backgroundColor);
    if(c&&c.a>.95)return c.rgb;n=n.parentElement}return [255,255,255]};
  const ratio=(a,b)=>{const l1=lum(a),l2=lum(b);return (Math.max(l1,l2)+.05)/(Math.min(l1,l2)+.05)};
  const out=[];
  document.querySelectorAll('*').forEach(el=>{
    if(el.closest('[hidden]')||el.offsetParent===null&&getComputedStyle(el).position!=='fixed')return;
    const txt=[...el.childNodes].filter(n=>n.nodeType===3&&n.textContent.trim()).map(n=>n.textContent.trim()).join(' ');
    if(!txt)return;
    const cs=getComputedStyle(el);
    if(cs.visibility==='hidden'||cs.opacity==='0')return;
    const fg=parse(cs.color); if(!fg||fg.a<.5)return;
    const size=parseFloat(cs.fontSize), w=parseInt(cs.fontWeight)||400;
    const large=size>=24||(size>=18.66&&w>=700);
    const r=ratio(fg.rgb,bgOf(el));
    const need=large?3:4.5;
    if(r<need)out.push({txt:txt.slice(0,60),r:+r.toFixed(2),need,size,w,sel:el.className&&(''+el.className).slice(0,60)||el.tagName});
  });
  return out;
})()`;

(async()=>{
  const b=await chromium.launch({executablePath:EXE});
  let fail=0;
  const screens=['cart','checkout','confirm','why'];
  for(const dir of ['ltr','rtl']){
    const p=await b.newPage({viewport:{width:1440,height:1000}});
    await p.goto('file://'+f); await p.waitForTimeout(400);
    if(dir==='rtl'){ await p.click('#t-dir'); await p.waitForTimeout(300); }
    for(const sc of screens){
      await p.evaluate(s=>location.hash=s,sc); await p.waitForTimeout(350);
      const bad=await p.evaluate(CONTRAST);
      if(bad.length){fail++;console.log(`  FAIL contrast ${dir}/${sc}`);bad.slice(0,8).forEach(x=>console.log('       ',x.r+':1 need '+x.need,'|',x.sel,'|',x.txt));}
      else console.log(`  ok   contrast ${dir}/${sc}`);
      // footer present and in the right mode
      const fv=await p.getAttribute('.hb-footer','data-view');
      const want=sc==='checkout'?'dashboard':'marketplace';
      fv===want?console.log(`  ok   footer ${dir}/${sc} = ${fv}`):(console.log(`  FAIL footer ${dir}/${sc} = ${fv}, want ${want}`),fail++);
    }
    // no horizontal scroll anywhere
    await p.evaluate(()=>location.hash='cart'); await p.waitForTimeout(300);
    const oflow=await p.evaluate(()=>document.documentElement.scrollWidth-document.documentElement.clientWidth);
    oflow>1?(console.log(`  FAIL horizontal overflow ${dir}: ${oflow}px`),fail++):console.log(`  ok   no horizontal overflow ${dir}`);
    // the footer really mirrors: brand region starts on the correct side
    const box=await p.evaluate(()=>{const r=document.querySelectorAll('.hb-footer__region');
      return {first:r[0].getBoundingClientRect().left,last:r[2].getBoundingClientRect().left}});
    const mirrored = dir==='rtl' ? box.first>box.last : box.first<box.last;
    mirrored?console.log(`  ok   footer regions mirror (${dir})`):(console.log(`  FAIL footer does not mirror in ${dir}`),fail++);
    const fam=await p.evaluate(()=>getComputedStyle(document.querySelector('.hb-footer')).fontFamily);
    console.log(`       footer font-family (${dir}): ${fam}`);
    await p.close();
  }

  // interactions
  const p=await b.newPage({viewport:{width:1440,height:1000}});
  await p.goto('file://'+f); await p.waitForTimeout(400);
  const tests=[
    ['header logo renders', async()=>{const r=await p.evaluate(()=>{const e=document.querySelector('.hb-header .hb-logo');const b=e.getBoundingClientRect();return {w:b.width,h:b.height,mask:getComputedStyle(e).webkitMaskImage.slice(0,20)}});return r.w>100&&r.h>20&&r.mask.includes('url')}],
    ['footer lockup renders', async()=>{const r=await p.evaluate(()=>{const e=document.querySelector('.hb-footer .hb-logo');const b=e.getBoundingClientRect();return {w:b.width,h:b.height,bg:getComputedStyle(e).backgroundColor}});return r.h>40&&r.bg==='rgb(255, 255, 255)'}],
    ['scroll-to-top hidden at top', async()=>await p.evaluate(()=>document.querySelector('#to-top').hidden===true)],
    ['scroll-to-top appears on scroll', async()=>{await p.evaluate(()=>window.scrollTo(0,900));await p.waitForTimeout(250);return await p.evaluate(()=>document.querySelector('#to-top').hidden===false)}],
    ['scroll-to-top returns to top', async()=>{await p.click('#to-top');await p.waitForTimeout(900);return await p.evaluate(()=>window.scrollY<10)}],
    ['download pill toasts', async()=>{await p.click('#f-app');await p.waitForTimeout(250);return await p.evaluate(()=>!!document.querySelector('#toasts .hb-snackbar'))}],
    ['quick link toasts, no hash jump', async()=>{await p.evaluate(()=>location.hash='cart');await p.waitForTimeout(200);
      await p.click('.hb-footer__links a');await p.waitForTimeout(250);
      return await p.evaluate(()=>location.hash==='#cart'&&!!document.querySelector('#toasts .hb-snackbar'))}],
    ['footer reduces on checkout', async()=>{await p.evaluate(()=>location.hash='checkout');await p.waitForTimeout(350);
      return await p.evaluate(()=>{const f=document.querySelector('.hb-footer');
        return f.dataset.view==='dashboard'&&getComputedStyle(f.querySelector('.hb-footer__regions')).display==='none'
          &&f.querySelector('.hb-footer__bar').getBoundingClientRect().height>0})}],
    ['footer returns on cart', async()=>{await p.evaluate(()=>location.hash='cart');await p.waitForTimeout(350);
      return await p.evaluate(()=>getComputedStyle(document.querySelector('.hb-footer__regions')).display==='flex')}],
    ['social buttons are 5, all empty and named', async()=>await p.evaluate(()=>{const a=[...document.querySelectorAll('.hb-footer__social a')];
      return a.length===5&&a.every(x=>x.dataset.needs&&!x.children.length&&x.getBoundingClientRect().width>30)})],
    ['mail + phone tiles empty and named', async()=>await p.evaluate(()=>{const t=[...document.querySelectorAll('.hb-footer__tile[data-needs]')];
      return t.length===2&&t.every(x=>!x.children.length)})],
    ['footer bands align with the body', async()=>await p.evaluate(()=>{
      const a=document.querySelector('.site').getBoundingClientRect(), b=document.querySelector('.hb-footer__bar').getBoundingClientRect();
      return Math.abs(a.left-b.left)<2&&Math.abs(a.right-b.right)<2})],
    ['compact 390 stacks the footer', async()=>{await p.setViewportSize({width:390,height:844});await p.waitForTimeout(300);
      const r=await p.evaluate(()=>{const f=document.querySelector('.hb-footer__regions');
        return {dir:getComputedStyle(f).flexDirection,div:getComputedStyle(document.querySelector('.hb-footer__divider')).display,
                ov:document.documentElement.scrollWidth-document.documentElement.clientWidth}});
      await p.setViewportSize({width:1440,height:1000});await p.waitForTimeout(200);
      return r.dir==='column'&&r.div==='none'&&r.ov<=1}],
    ['still places an order end to end', async()=>{
      await p.evaluate(()=>location.hash='checkout');await p.waitForTimeout(400);
      const btn=await p.$('[data-act="place-order"]'); if(!btn) return false;
      await btn.click(); await p.waitForTimeout(600);
      return await p.evaluate(()=>!document.querySelector('#screen-confirm').hidden)}],
  ];
  for(const [name,fn] of tests){
    let r=false,err=null; try{r=await fn()}catch(e){err=e.message}
    r?console.log('  ok   '+name):(console.log('  FAIL '+name+(err?' — '+err:'')),fail++);
  }
  await p.close(); await b.close();
  console.log(fail?`\n${fail} FAILURE(S)`:'\nsweep clean');
  process.exit(fail?1:0);
})();
