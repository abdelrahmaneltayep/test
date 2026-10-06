/* Builds the About Us page prototype on the Highbase design system.
   Usage: node build.js [path-to-highbase-ds] [--artifact]  → index.html | artifact.html */
const fs = require('fs'), path = require('path');
const ARTIFACT = process.argv.includes('--artifact');
const DS = process.argv.filter(a => a !== '--artifact')[2] || process.env.HIGHBASE_DS || path.resolve(__dirname, '../../../highbase-ds');
if (!fs.existsSync(path.join(DS, '03_Tokens/dist/tokens.css'))) { console.error('Cannot find the Highbase design system at: ' + DS); process.exit(1); }
const read = p => fs.readFileSync(path.join(DS, p), 'utf8');
const COMPONENTS = ['04_Components/molecules/_base/Field.css', '04_Components/atoms/Button/Button.css', '04_Components/atoms/IconButton/IconButton.css', '04_Components/atoms/Badge/Badge.css', '04_Components/atoms/Chip/Chip.css', '04_Components/atoms/Avatar/Avatar.css', '04_Components/molecules/SearchField/SearchField.css', '04_Components/organisms/Header/Header.css', '04_Components/organisms/Footer/Footer.css', '04_Components/organisms/Card/Card.css', '04_Components/organisms/ProductCard/ProductCard.css', '06_Illustrations/Illustration.css'];
const dsCss = COMPONENTS.map(f => `/* ==== ${path.basename(f)} ==== */\n` + read(f)).join('\n');
const { SPRITE: ISPRITE, NAMES } = require(path.join(DS, '05_Icons/ui.js'));
const { SPRITE: LSPRITE, il } = require(path.join(DS, '06_Illustrations/illustrations.js'));
const ic = (n, cls) => { if (!(n in NAMES)) throw new Error('Unknown icon ' + n); return `<svg class="hb-i ${cls || ''}" aria-hidden="true"><use href="#hb-i-${n}"/></svg>`; };
const C = require('./content.js');

/* ---- DS header (marketplace, signed-in buyer) ---- */
const LOGO = `<a href="#" class="logo" aria-label="Highbase home"><svg viewBox="0 0 191 28" width="152" height="22"><text x="0" y="21" font-family="Public Sans" font-size="22" font-weight="700" letter-spacing="2" fill="var(--hb-color-primary-700)">HIGHBASE</text></svg></a>`;
const action = (icon, count, collapse) => `<span class="hb-header__action"${collapse ? ' data-collapse' : ''}><button class="hb-btn hb-icon-btn" data-intent="secondary" data-style="ghost" data-size="md" aria-label="${icon}"><span class="hb-btn__icon">${ic(icon)}</span></button>${count ? `<span class="hb-badge" data-variant="count" data-color="primary">${count}</span>` : ''}</span>`;
const header = `<header class="hb-header" data-view="marketplace" data-size="expanded">${LOGO}<span class="hb-header__nav"><button class="hb-header__pill">${ic('grid')}<span>Categories</span><span data-mirror>${ic('chevronDown')}</span></button><button class="hb-header__pill">${ic('tag')}<span>Brands</span></button></span><span class="hb-header__search"><span class="hb-search" data-state="default"><span class="hb-search__icon">${ic('search')}</span><input class="hb-search__input" placeholder="Search by name, category or brand"></span></span><span class="hb-header__actions">${action('gift', '1', 1)}${action('cart', '', 0)}${action('message', '', 1)}${action('notification', '4', 1)}</span><span class="hb-header__language"><button class="hb-header__pill">${ic('globe')}<span>العربية</span></button></span><button class="hb-header__account"><span class="hb-avatar" data-shape="square" data-size="40">AN</span><span class="hb-header__account-lines"><span class="hb-header__account-name">Al Noor Cafeteria</span><span class="hb-header__account-branch">Branch: Manama</span></span><span data-mirror>${ic('chevronDown')}</span></button></header>`;

/* ---- DS footer (from organisms/Footer/build-demo.js, same markup) ---- */
const FLOGO = `<svg viewBox="0 0 191 43" width="168" height="38" aria-label="Highbase — where you grow"><text x="0" y="24" font-family="Public Sans" font-size="24" font-weight="700" letter-spacing="2" fill="currentColor">HIGHBASE</text><text x="1" y="38" font-family="Public Sans" font-size="9" letter-spacing="4" fill="currentColor">WHERE YOU GROW</text></svg>`;
const frow = (value, icon, chev) => `<span class="hb-footer__row"><span class="hb-footer__tile">${icon || ''}</span><span class="hb-footer__value">${value}</span>${chev ? `<span data-mirror>${ic('chevronRight')}</span>` : ''}</span>`;
const footer = `<footer class="hb-footer" data-view="marketplace"><div class="hb-footer__regions"><div class="hb-footer__region">${FLOGO}<span class="hb-footer__blurb">HIGHBASE TRADING W.L.L, we connect businesses through our innovative B2B marketplace, providing access to quality products and trusted partners. We empower companies to grow and thrive in dynamic markets by enhancing efficiency and reach. Join us in shaping the future of B2B E-commerce.</span><span class="hb-footer__social">${['LinkedIn', 'YouTube', 'WhatsApp', 'Instagram', 'Facebook'].map(n => `<a href="#" aria-label="${n}"></a>`).join('')}</span></div><span class="hb-footer__divider"></span><div class="hb-footer__region"><span class="hb-footer__heading">Quick Links</span><span class="hb-footer__link-columns"><span class="hb-footer__links"><a href="#">Home</a><a href="#">Brands</a><a href="#">Terms &amp; Conditions</a></span><span class="hb-footer__links"><a href="#" aria-current="page">About Us</a><a href="#">User Guide</a><a href="#">Privacy Policy</a></span></span><button class="hb-footer__download">${ic('download')}<span>Download Our App Now</span></button></div><span class="hb-footer__divider"></span><div class="hb-footer__region"><span class="hb-footer__heading">Contact Us</span>${frow('info@highbaseco.com', ic('mail'))}${frow('+973-13300833', ic('phone'))}${frow('HIGHBASE TRADING W.L.L Road 2845 Seef, Kingdom of Bahrain', ic('location'))}${frow('Leave us a message', ic('message'), true)}</div></div><span class="hb-footer__rule"></span><div class="hb-footer__bar"><span class="hb-footer__copyright">© 2026 HIGHBASE. All Rights Reserved</span></div></footer>`;

/* ---- the ten versions ---- */
const R = require('./sections.js')(C, ic, il);
const VERSIONS = [
  ['Editorial split',  'Hero text beside the spot illustration; calm white and tinted sections.',            () => [R.heroSplit(), R.what('01'), R.who('02'), R.how('03'), R.why('04', true), R.both('05'), R.global('06'), R.finalCta(), R.contact()]],
  ['Numbers first',    'Short centred hero, then a dark trust band of facts — the JOOR pattern.',             () => [R.heroShort(), R.trust('dark'), R.what('01'), R.who('02'), R.how('03'), R.why('04', true), R.both('05'), R.global('06'), R.finalCta(), R.contact()]],
  ['Two audiences',    'The hero splits into a buyer card and a supplier card, each with its own CTA — Faire.', () => [R.heroTwo(), R.trust('light'), R.what('01'), R.who('02'), R.how('03'), R.why('04', true), R.both('05'), R.global('06'), R.finalCta(), R.contact()]],
  ['Explainer',        '“What is HIGHBASE?” as the H1 in a reading column — the Amazon Business pattern.',     () => [R.heroExplainer(), R.who('01', 'sec--read'), R.how('02'), R.why('03', true), R.both('04'), R.trust('light'), R.global('05'), R.finalCta(), R.contact()]],
  ['Product led',      'Hero shows the marketplace itself: a device frame with live Product Cards.',           () => [R.heroProduct(), R.trust('light'), R.what('01'), R.who('02'), R.how('03'), R.why('04', true), R.both('05'), R.global('06'), R.finalCta(), R.contact()]],
  ['Reasons list',     '“Why HIGHBASE” opens the page as 01–04 with a concrete fact each — Uline.',           () => [R.heroReasons(), R.what('01'), R.trust('dark'), R.who('02'), R.how('03'), R.both('04'), R.global('05'), R.finalCta(), R.contact()]],
  ['Journey',          'A three-node timeline (register, order, track) carries both sides of the trade.',     () => [R.heroShort(), R.journey('01'), R.what('02'), R.who('03'), R.why('04', true), R.both('05'), R.global('06'), R.finalCta(), R.contact()]],
  ['Dark hero',        'Hero on the footer’s dark blue with the orange accent; light sections follow.',        () => [R.heroDark(), R.trust('light'), R.what('01'), R.who('02'), R.how('03'), R.why('04', true), R.both('05'), R.global('06'), R.finalCta('light'), R.contact()]],
  ['Region first',     'Bahrain and the Gulf up front: a headquarters card beside the hero — Tradeling.',      () => [R.heroRegion(), R.trust('dark'), R.what('01'), R.who('02'), R.how('03'), R.why('04', true), R.both('05'), R.global('06'), R.finalCta(), R.contact()]],
  ['Bento grid',       'Mixed-size tiles carry hero, facts, audiences, reasons and steps; sticky CTAs on mobile.', () => [R.heroBento(), R.what('01'), R.both('02'), R.global('03'), R.finalCta(), R.contact(), R.sticky()]],
];
const mains = VERSIONS.map(([name, , build], i) => `<main class="about v${i + 1}" data-v="${i + 1}" aria-label="Version ${i + 1} — ${name}"${i ? ' hidden' : ''}>${build().join('\n')}</main>`).join('\n');
const bar = `<div class="px-bar" id="px-bar"><span class="px-title">Prototype</span>
<span class="px-seg" role="group" aria-label="Version"><b>Option</b>${VERSIONS.map(([n], i) => `<button data-ver="${i + 1}" aria-pressed="${i === 0}" title="${n}">${i + 1}<span class="px-vname"> ${n}</span></button>`).join('')}</span>
<span class="px-seg" role="group" aria-label="Preview"><b>Preview</b><button data-view="desk" aria-pressed="true">Desktop</button><button data-view="mob" aria-pressed="false">Mobile</button></span>
<span class="px-seg" role="group" aria-label="Global trade section"><b>06 · Global</b><button data-global="0" aria-pressed="true">Hidden (now)</button><button data-global="1" aria-pressed="false">Shown (at launch)</button></span>
<span class="px-note" id="px-desc"></span></div>`;
const script = `(function(){
var DESC=${JSON.stringify(VERSIONS.map(([n, d]) => n + ' — ' + d))};
var bar=document.getElementById('px-bar'), frame=document.getElementById('frame'), app=document.getElementById('app'), desc=document.getElementById('px-desc');
function press(group, attr, val){ bar.querySelectorAll('['+attr+']').forEach(function(b){ b.setAttribute('aria-pressed', String(b.getAttribute(attr)===String(val))); }); }
function setVer(v){ v=Math.min(10,Math.max(1,v|0||1)); app.querySelectorAll('main[data-v]').forEach(function(m){ m.hidden = m.getAttribute('data-v')!==String(v); }); press('ver','data-ver',v); desc.textContent=DESC[v-1]; app.setAttribute('data-ver',v); try{ history.replaceState(null,'','#v'+v); }catch(e){} app.scrollTo(0,0); window.scrollTo(0,0); }
function setView(m){ frame.classList.toggle('frame--phone', m==='mob'); app.classList.toggle('m', m==='mob'); press('view','data-view',m); }
function setGlobal(on){ app.querySelectorAll('.sec--global').forEach(function(s){ s.hidden=!on; }); press('global','data-global',on?1:0); }
bar.addEventListener('click', function(e){ var b=e.target.closest('button'); if(!b) return; if(b.hasAttribute('data-ver')) setVer(+b.getAttribute('data-ver')); else if(b.hasAttribute('data-view')) setView(b.getAttribute('data-view')); else if(b.hasAttribute('data-global')) setGlobal(b.getAttribute('data-global')==='1'); });
app.addEventListener('click', function(e){ var a=e.target.closest('a[href="#"]'); if(a) e.preventDefault(); });
var m=/^#v(\\d+)$/.exec(location.hash); setVer(m?+m[1]:1);
})();`;
const head = `<title>Highbase About Us</title>
<link rel="preconnect" href="https://fonts.googleapis.com"><link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Public+Sans:wght@400;500;600;700;800&display=swap">
<style>
/* Mocks a live marketplace page: single light theme on purpose, paints its own ground. */
:root{color-scheme:light}
${read('03_Tokens/dist/tokens.css')}
${dsCss}
.hb-i{width:1em;height:1em;display:inline-block;fill:currentColor;flex:0 0 auto}[dir="rtl"] [data-mirror]>.hb-i,[dir="rtl"] .hb-i[data-mirror]{transform:scaleX(-1)}
${fs.readFileSync(path.join(__dirname, 'about.css'), 'utf8')}
</style>`;
const body = `${ISPRITE}${LSPRITE}
${bar}
<div id="frame" class="frame"><div id="app" class="app">${header}
${mains}
${footer}</div></div>
<script>${script}<\/script>`;
const html = ARTIFACT ? head + '\n' + body + '\n' : `<!doctype html>\n<html lang="en" dir="ltr">\n<head>\n<meta charset="utf-8">\n<meta name="viewport" content="width=device-width, initial-scale=1">\n${head}\n</head>\n<body>\n${body}\n</body>\n</html>`;
const out = path.join(__dirname, ARTIFACT ? 'artifact.html' : 'index.html');
fs.writeFileSync(out, html);
console.log('Wrote ' + out + ' (' + (html.length / 1024).toFixed(0) + ' KB), ' + VERSIONS.length + ' versions');
