/* Builds the self-contained buyer-journey prototype.
   Usage: node build.js [path-to-highbase-ds] [--artifact]  → index.html | artifact.html
   The deliverable is one HTML file with inline CSS and JS; this script only inlines the design system. */
const fs = require('fs'), path = require('path');
const ARTIFACT = process.argv.includes('--artifact');
const DS = process.argv.filter(a => a !== '--artifact')[2] || process.env.HIGHBASE_DS || path.resolve(__dirname, '../../../highbase-ds');
if (!fs.existsSync(path.join(DS, '03_Tokens/dist/tokens.css'))) { console.error('Cannot find the Highbase design system at: ' + DS); process.exit(1); }
const read = p => fs.readFileSync(path.join(DS, p), 'utf8');
const COMPONENTS = ['molecules/_base/Field.css', 'molecules/_base/Alert.css', 'atoms/Button/Button.css', 'atoms/IconButton/IconButton.css', 'atoms/Badge/Badge.css', 'atoms/Chip/Chip.css', 'atoms/Avatar/Avatar.css',
  'atoms/Switch/Switch.css', 'atoms/Checkbox/Checkbox.css', 'atoms/RadioButton/RadioButton.css', 'molecules/SearchField/SearchField.css', 'molecules/TextField/TextField.css', 'molecules/TextArea/TextArea.css', 'molecules/Select/Select.css',
  'molecules/Breadcrumb/Breadcrumb.css', 'molecules/AddToCart/AddToCart.css', 'molecules/Snackbar/Snackbar.css', 'molecules/InlineAlert/InlineAlert.css', 'molecules/Tabs/Tabs.css', 'molecules/Tooltip/Tooltip.css', 'molecules/Menu/Menu.css',
  'molecules/DialogHeader/DialogHeader.css', 'molecules/DialogActions/DialogActions.css', 'organisms/Header/Header.css', 'organisms/Footer/Footer.css', 'organisms/Card/Card.css', 'organisms/ProductCard/ProductCard.css',
  'organisms/BottomSheet/BottomSheet.css', 'organisms/EmptyState/EmptyState.css', 'organisms/Drawer/Drawer.css'].map(f => '04_Components/' + f);
const dsCss = COMPONENTS.map(f => `/* ==== ${path.basename(f)} ==== */\n` + read(f)).join('\n') + '\n' + read('06_Illustrations/Illustration.css');
const { SPRITE: ISPRITE, NAMES } = require(path.join(DS, '05_Icons/ui.js'));
const { SPRITE: LSPRITE } = require(path.join(DS, '06_Illustrations/illustrations.js'));
const src = f => fs.readFileSync(path.join(__dirname, f), 'utf8');
const appJs = src('app.js'), dataJs = src('data.js');
const used = [...new Set([...appJs.matchAll(/\bic\(\s*['"]([A-Za-z]+)['"]/g)].map(m => m[1]))];
const missing = used.filter(k => !(k in NAMES)); if (missing.length) { console.error('Unknown icon key(s): ' + missing.join(', ')); process.exit(1); }
/* compact rules are written once as `.m …` for the phone frame; the same rules are emitted as a media query for real narrow windows */
const cssSrc = src('app.css');
const mRules = cssSrc.split('\n').filter(l => l.startsWith('.m ')).map(l => l.replace(/\.m /g, '.app ')).join(' ');
const css = cssSrc + '\n@media (max-width:759px){' + mRules + '}\n';
const head = `<title>Highbase Buyer Journey</title>
<link rel="preconnect" href="https://fonts.googleapis.com"><link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Public+Sans:wght@400;500;600;700;800&family=Noto+Kufi+Arabic:wght@400;500;600;700&display=swap">
<style>
:root{color-scheme:light}
${read('03_Tokens/dist/tokens.css')}
${dsCss}
.hb-i{width:1em;height:1em;display:inline-block;fill:currentColor;flex:0 0 auto}[dir="rtl"] [data-mirror]>.hb-i,[dir="rtl"] .hb-i[data-mirror]{transform:scaleX(-1)}
${css}
</style>`;
const body = `${ISPRITE}${LSPRITE}
<div id="px-bar" class="px-bar" aria-label="Prototype controls"></div>
<div id="frame" class="frame"><div id="app" class="app" lang="en" dir="ltr"></div></div>
<div id="toasts" class="toasts" aria-live="polite"></div>
<script>${dataJs}<\/script>
<script>${appJs}<\/script>`;
const html = ARTIFACT ? head + '\n' + body + '\n' : `<!doctype html>\n<html lang="en">\n<head>\n<meta charset="utf-8">\n<meta name="viewport" content="width=device-width, initial-scale=1">\n${head}\n</head>\n<body>\n${body}\n</body>\n</html>`;
const out = path.join(__dirname, ARTIFACT ? 'artifact.html' : 'index.html');
fs.writeFileSync(out, html);
console.log('Wrote ' + out + ' (' + (html.length / 1024).toFixed(0) + ' KB), icons: ' + used.length);
