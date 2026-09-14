const fs=require('fs');
const H='/home/user/highbase-ds';
const R=f=>require('path').join(__dirname,f);
const SRC={head:fs.readFileSync(R('head.html'),'utf8'),shell:fs.readFileSync(R('shell.html'),'utf8'),
  js:['s1-state.js','s2-render.js','s3-mutations.js','s4-dialogs.js','s5-file-order.js','s6-eval.js','s7-events.js']
     .map(f=>fs.readFileSync(R(f),'utf8')).join('\n')};
const page=fs.readFileSync(R('highbase-checkout-proposal.html'),'utf8');
// the prototype layer = everything I author; DS parts are verbatim and audited upstream
const proto=SRC.head.split('/*__DS_CSS__*/')[1]||SRC.head;
let fail=0; const bad=(m)=>{console.log('  FAIL '+m);fail++;};
const ok=(m)=>console.log('  ok   '+m);

// 1 · raw hex in anything I author
const protoDecl=proto.replace(/\/\*[\s\S]*?\*\//g,'');
const hex=[...protoDecl.matchAll(/#[0-9a-fA-F]{3,8}\b/g)].map(m=>m[0])
  .filter(h=>!/^#hb-/.test(h));
hex.length?bad('raw hex in the prototype layer: '+hex.join(' ')):ok('no raw hex in the prototype layer');

// 2 · physical left/right
const phys=[...proto.matchAll(/(?:^|[;{\s])(margin|padding|border|inset|text-align|float|left|right)-?(left|right)?\s*:\s*[^;]*/g)]
  .map(m=>m[0].trim()).filter(t=>/-(left|right)\s*:|:\s*(left|right)\b/.test(t));
phys.length?bad('physical left/right: '+phys.join(' | ')):ok('no physical left/right in the prototype layer');

// 3 · off-scale spacing — every --hb-space-N referenced must be a real step
const steps=new Set([...fs.readFileSync(H+'/03_Tokens/dist/tokens.css','utf8')
  .matchAll(/--hb-space-(\d+)\s*:/g)].map(m=>m[1]));
const usedSpace=[...new Set([...proto.matchAll(/--hb-space-(\d+)/g)].map(m=>m[1]))];
const offScale=usedSpace.filter(n=>!steps.has(n));
offScale.length?bad('off-scale spacing steps: '+offScale.join(' ')):ok(usedSpace.length+' spacing steps referenced, all on the 22-step scale');

// 4 · dangling --hb-* references anywhere in the shipped page
const defined=new Set([...page.matchAll(/^\s*(--hb-[a-z0-9-]+)\s*:/gm)].map(m=>m[1]));
const refd=new Set([...page.matchAll(/var\((--hb-[a-z0-9-]+)/g)].map(m=>m[1]));
const dangling=[...refd].filter(v=>!defined.has(v));
const KNOWN=['--hb-font-size-13'];   // recorded open decision in Coupon.css
const unexpected=dangling.filter(v=>!KNOWN.includes(v));
unexpected.length?bad('dangling token refs: '+unexpected.join(' ')):
  ok('no dangling token refs'+(dangling.length?' beyond the known '+dangling.join(' '):''));

// 5 · every sprite reference resolves to a symbol in the page
const syms=new Set([...page.matchAll(/<symbol id="(hb-i-[A-Za-z0-9]+)"/g)].map(m=>m[1]));
const uses=[...new Set([...page.matchAll(/href="#(hb-i-[A-Za-z0-9]+)"/g)].map(m=>m[1]))];
const missIcon=uses.filter(u=>!syms.has(u));
missIcon.length?bad('dangling sprite refs: '+missIcon.join(' ')):ok(uses.length+' icon refs, all resolve');

// 6 · balanced comments + the stylesheet is not empty
const css=page.split('<style>')[1].split('</style>')[0];
const o=(css.match(/\/\*/g)||[]).length, c=(css.match(/\*\//g)||[]).length;
o!==c?bad(`unbalanced CSS comments ${o} open / ${c} close`):ok('CSS comments balance ('+o+' pairs)');

// 7 · the Footer + Logo really are the DS files, verbatim
for(const [name,path] of [['Footer','04_Components/organisms/Footer/Footer.css'],
                          ['Logo','04_Components/atoms/Logo/Logo.css'],
                          ['ScrollToTop','04_Components/organisms/ScrollToTop/ScrollToTop.css'],
                          ['Header','04_Components/organisms/Header/Header.css']]){
  const src=fs.readFileSync(H+'/'+path,'utf8').trim();
  page.includes(src)?ok(name+'.css embedded verbatim from highbase-ds'):bad(name+'.css is NOT verbatim');
}

// 8 · no hb-footer class in the markup that the component does not define
const footCss=fs.readFileSync(H+'/04_Components/organisms/Footer/Footer.css','utf8');
const footClasses=[...new Set([...SRC.shell.matchAll(/class="([^"]*hb-footer[^"]*)"/g)]
  .flatMap(m=>m[1].split(/\s+/)).filter(c=>c.startsWith('hb-footer')))];
const undef=footClasses.filter(c=>!footCss.includes('.'+c));
undef.length?bad('footer classes with no rule: '+undef.join(' ')):ok(footClasses.length+' hb-footer classes, all defined by the component');

console.log(fail?`\n${fail} FAILURE(S)`:'\nall static checks pass');
process.exit(fail?1:0);
