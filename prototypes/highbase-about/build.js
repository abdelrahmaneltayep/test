/* Builds the About Us page prototype on the Highbase design system.
   Usage: node build.js [path-to-highbase-ds] [--artifact]  → index.html | artifact.html */
const fs = require('fs'), path = require('path');
const ARTIFACT = process.argv.includes('--artifact');
const DS = process.argv.filter(a => a !== '--artifact')[2] || process.env.HIGHBASE_DS || path.resolve(__dirname, '../../../highbase-ds');
if (!fs.existsSync(path.join(DS, '03_Tokens/dist/tokens.css'))) { console.error('Cannot find the Highbase design system at: ' + DS); process.exit(1); }
const read = p => fs.readFileSync(path.join(DS, p), 'utf8');
const COMPONENTS = ['04_Components/molecules/_base/Field.css', '04_Components/atoms/Button/Button.css', '04_Components/atoms/IconButton/IconButton.css', '04_Components/atoms/Badge/Badge.css', '04_Components/atoms/Chip/Chip.css', '04_Components/atoms/Avatar/Avatar.css', '04_Components/molecules/SearchField/SearchField.css', '04_Components/organisms/Header/Header.css', '04_Components/organisms/Footer/Footer.css', '04_Components/organisms/Card/Card.css', '06_Illustrations/Illustration.css'];
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
const footer = `<footer class="hb-footer" data-view="marketplace"><div class="hb-footer__regions"><div class="hb-footer__region">${FLOGO}<span class="hb-footer__blurb">HIGHBASE TRADING W.L.L, we connect businesses through our innovative B2B marketplace, providing access to quality products and trusted partners. We empower companies to grow and thrive in dynamic markets by enhancing efficiency and reach. Join us in shaping the future of B2B E-commerce.</span><span class="hb-footer__social">${['LinkedIn', 'YouTube', 'WhatsApp', 'Instagram', 'Facebook'].map(n => `<a href="#" aria-label="${n}"></a>`).join('')}</span></div><span class="hb-footer__divider"></span><div class="hb-footer__region"><span class="hb-footer__heading">Quick Links</span><span class="hb-footer__link-columns"><span class="hb-footer__links"><a href="#">Home</a><a href="#">Brands</a><a href="#">Terms &amp; Conditions</a></span><span class="hb-footer__links"><a href="#" aria-current="page">About Us</a><a href="#">User Guide</a><a href="#">Privacy Policy</a></span></span><button class="hb-footer__download">${ic('download')}<span>Download Our App Now</span></button></div><span class="hb-footer__divider"></span><div class="hb-footer__region"><span class="hb-footer__heading">Contact Us</span>${frow('info@highbaseco.com')}${frow('+973-13300833')}${frow('HIGHBASE TRADING W.L.L Road 2845 Seef, Kingdom of Bahrain', ic('location'))}${frow('Leave us a message', ic('message'), true)}</div></div><span class="hb-footer__rule"></span><div class="hb-footer__bar"><span class="hb-footer__copyright">© 2026 HIGHBASE. All Rights Reserved</span></div></footer>`;

/* ---- page ---- */
const btn = (label, style, intent) => `<a class="hb-btn" href="#" data-intent="${intent || 'primary'}" data-style="${style}" data-size="lg"><span class="hb-btn__label">${label}</span></a>`;
const ctas = () => `<div class="ctas">${btn(C.cta.buyer, 'filled')}${btn(C.cta.supplier, 'outlined')}</div>`;
const checklist = items => `<ul class="checks">${items.map(i => `<li><span class="checks__dot">${ic('check')}</span><span>${i}</span></li>`).join('')}</ul>`;
const steps = (title, items) => `<div class="hb-card steps"><h3 class="steps__title">${title}</h3><ol class="steps__list">${items.map((s, i) => `<li class="step"><span class="step__n">0${i + 1}</span><span class="step__body"><b>${s[0]}</b><span>${s[1]}</span></span></li>`).join('')}</ol></div>`;
const page = `
<main class="about" id="main">
  <section class="hero" aria-labelledby="h-hero">
    <div class="hero__text"><span class="eyebrow">${C.hero.eyebrow}</span><h1 class="hero__title" id="h-hero">${C.hero.title}</h1><p class="hero__lede">${C.hero.lede}</p>${ctas()}</div>
    <div class="hero__art" aria-hidden="true">${il('welcome', 'lg')}</div>
  </section>
  <section class="sec" aria-labelledby="h-what"><div class="sec__grid sec__grid--2"><div><span class="eyebrow">01</span><h2 class="sec__title" id="h-what">${C.what.title}</h2></div><div class="prose"><p>${C.what.p1}</p><div class="callout">${ic('info')}<p>${C.what.p2}</p></div></div></div></section>
  <section class="sec sec--tint" aria-labelledby="h-who"><div class="sec__head"><span class="eyebrow">02</span><h2 class="sec__title" id="h-who">${C.who.title}</h2></div><ul class="tiles" role="list">${C.who.items.map(w => `<li class="tile"><span class="tile__icon">${ic(w[0])}</span><span class="tile__name">${w[1]}</span>${w[2] ? `<span class="tile__text">${w[2]}</span>` : ''}</li>`).join('')}</ul></section>
  <section class="sec" aria-labelledby="h-how"><div class="sec__head"><span class="eyebrow">03</span><h2 class="sec__title" id="h-how">${C.how.title}</h2><p class="sec__lede">${C.how.lede}</p></div><div class="sec__grid sec__grid--2">${steps(C.how.buyers.title, C.how.buyers.steps)}${steps(C.how.suppliers.title, C.how.suppliers.steps)}</div></section>
  <section class="sec sec--tint" aria-labelledby="h-both"><div class="sec__head"><span class="eyebrow">04</span><h2 class="sec__title" id="h-both">${C.both.title}</h2></div><div class="sec__grid sec__grid--2">${[C.both.buyers, C.both.suppliers].map(b => `<div class="hb-card side"><span class="side__icon">${ic(b.icon)}</span><h3 class="side__title">${b.title}</h3><p class="side__lede">${b.lede}</p>${checklist(b.items)}</div>`).join('')}</div><p class="note">${C.both.note}</p></section>
  <section class="sec sec--global" id="global" aria-labelledby="h-global" hidden><div class="sec__head"><span class="eyebrow">05 · <span class="hb-chip" data-style="tonal" data-size="sm"><span class="hb-chip__label">${C.global.badge}</span></span></span><h2 class="sec__title" id="h-global">${C.global.title}</h2><p class="sec__lede">${C.global.lede}</p></div><div class="sec__grid sec__grid--2">${[C.global.buy, C.global.sell].map(g => `<div class="hb-card side"><span class="side__icon">${ic('globe')}</span><h3 class="side__title">${g.title}</h3><p class="side__lede">${g.text}</p></div>`).join('')}</div></section>
  <section class="sec" aria-labelledby="h-why"><div class="sec__head"><span class="eyebrow">06</span><h2 class="sec__title" id="h-why">${C.why.title}</h2></div><ul class="whys" role="list">${C.why.items.map(w => `<li class="why"><span class="why__icon">${ic(w[0])}</span><b>${w[1]}</b><span>${w[2]}</span></li>`).join('')}</ul></section>
  <section class="cta" aria-labelledby="h-cta"><h2 class="cta__title" id="h-cta">${C.final.title}</h2><p class="cta__lede">${C.final.lede}</p>${ctas()}</section>
</main>`;
const chrome = `<div class="px-bar" id="px-bar"><span class="px-title">Prototype</span><span class="px-seg"><b>Preview</b><button data-view="desk" aria-pressed="true">Desktop</button><button data-view="mob" aria-pressed="false">Mobile</button></span><span class="px-seg"><b>Section 05 · Global trade</b><button data-global="0" aria-pressed="true">Hidden (now)</button><button data-global="1" aria-pressed="false">Shown (at launch)</button></span><span class="px-note">English only — Arabic copy pending from marketing.</span></div>`;
const script = `document.addEventListener('click',function(e){var b=e.target.closest('[data-view],[data-global]');if(!b)return;var k=b.hasAttribute('data-view')?'data-view':'data-global';b.parentNode.querySelectorAll('button').forEach(function(x){x.setAttribute('aria-pressed',String(x===b))});if(k==='data-view'){document.getElementById('frame').className='frame'+(b.getAttribute('data-view')==='mob'?' frame--phone':'');document.getElementById('app').classList.toggle('m',b.getAttribute('data-view')==='mob')}else{document.getElementById('global').hidden=b.getAttribute('data-global')!=='1'}});`;
const head = `<title>Highbase About Us</title>
<link rel="preconnect" href="https://fonts.googleapis.com"><link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Public+Sans:wght@400;500;600;700;800&family=Noto+Kufi+Arabic:wght@400;500;600;700&display=swap">
<style>
:root{color-scheme:light}
${read('03_Tokens/dist/tokens.css')}
${dsCss}
.hb-i{width:1em;height:1em;display:inline-block;fill:currentColor;flex:0 0 auto}[dir="rtl"] [data-mirror]>.hb-i,[dir="rtl"] .hb-i[data-mirror]{transform:scaleX(-1)}
${fs.readFileSync(path.join(__dirname, 'about.css'), 'utf8')}
</style>`;
const body = `${ISPRITE}${LSPRITE}
${chrome}
<div id="frame" class="frame"><div class="app" id="app">${header}${page}${footer}</div></div>
<script>${script}<\/script>`;
const html = ARTIFACT ? head + '\n' + body + '\n' : `<!doctype html>\n<html lang="en" dir="ltr">\n<head>\n<meta charset="utf-8">\n<meta name="viewport" content="width=device-width, initial-scale=1">\n${head}\n</head>\n<body>\n${body}\n</body>\n</html>`;
const out = path.join(__dirname, ARTIFACT ? 'artifact.html' : 'index.html');
fs.writeFileSync(out, html); console.log('Wrote ' + out + ' (' + (html.length / 1024).toFixed(0) + ' KB)');
