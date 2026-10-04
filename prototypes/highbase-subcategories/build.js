/* Builds the self-contained subcategory-pages prototype.
   Usage:  node build.js [path-to-highbase-ds] [--artifact]
   Output: index.html (standalone) or artifact.html (no html/head/body shell — the Artifact host adds it). */
const fs = require('fs'), path = require('path');
const ARTIFACT = process.argv.includes('--artifact');
const DS = process.argv.filter(a => a !== '--artifact')[2] || process.env.HIGHBASE_DS || path.resolve(__dirname, '../../../highbase-ds');
if (!fs.existsSync(path.join(DS, '03_Tokens/dist/tokens.css'))) { console.error('Cannot find the Highbase design system at: ' + DS); process.exit(1); }
const read = p => fs.readFileSync(path.join(DS, p), 'utf8');
const COMPONENTS = [
  '04_Components/molecules/_base/Field.css', '04_Components/molecules/_base/Alert.css',
  '04_Components/atoms/Button/Button.css', '04_Components/atoms/IconButton/IconButton.css', '04_Components/atoms/Badge/Badge.css', '04_Components/atoms/Chip/Chip.css',
  '04_Components/atoms/Avatar/Avatar.css', '04_Components/atoms/Switch/Switch.css', '04_Components/atoms/Checkbox/Checkbox.css', '04_Components/atoms/RadioButton/RadioButton.css',
  '04_Components/molecules/SearchField/SearchField.css', '04_Components/molecules/TextField/TextField.css', '04_Components/molecules/Breadcrumb/Breadcrumb.css',
  '04_Components/molecules/AddToCart/AddToCart.css', '04_Components/molecules/Snackbar/Snackbar.css', '04_Components/molecules/DialogHeader/DialogHeader.css', '04_Components/molecules/DialogActions/DialogActions.css',
  '04_Components/organisms/Header/Header.css', '04_Components/organisms/Card/Card.css', '04_Components/organisms/ProductCard/ProductCard.css', '04_Components/organisms/BottomSheet/BottomSheet.css', '04_Components/organisms/EmptyState/EmptyState.css'
];
const dsCss = COMPONENTS.map(f => `/* ==== ${path.basename(f)} ==== */\n` + read(f)).join('\n');
const { SPRITE, NAMES } = require(path.join(DS, '05_Icons/ui.js'));
const appJs = fs.readFileSync(path.join(__dirname, 'app.js'), 'utf8'), modelJs = fs.readFileSync(path.join(__dirname, 'model.js'), 'utf8');
const products = JSON.stringify(JSON.parse(fs.readFileSync(path.join(__dirname, 'products.json'), 'utf8')));
const used = [...new Set([...appJs.matchAll(/\bic\(\s*['"]([A-Za-z]+)['"]/g)].map(m => m[1]))];
const missing = used.filter(k => !(k in NAMES)); if (missing.length) { console.error('Unknown icon key(s): ' + missing.join(', ')); process.exit(1); }
const iconCss = `.hb-i{width:1em;height:1em;display:inline-block;fill:currentColor;flex:0 0 auto}[dir="rtl"] [data-mirror]>.hb-i,[dir="rtl"] .hb-i[data-mirror]{transform:scaleX(-1)}`;
const head = `<title>Highbase Subcategories</title>
<link rel="preconnect" href="https://fonts.googleapis.com"><link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Public+Sans:wght@400;500;600;700;800&family=Noto+Kufi+Arabic:wght@400;500;600;700&display=swap">
<style>
/* Mocks a live product page, so it stays single-theme on purpose and paints its own white ground. */
:root{color-scheme:light}
${read('03_Tokens/dist/tokens.css')}
${dsCss}
${iconCss}
${fs.readFileSync(path.join(__dirname, 'proto.css'), 'utf8')}
</style>`;
const body = `${SPRITE}
<div id="px-chrome"></div>
<div id="frame" class="frame"></div>
<details class="px-log" id="px-log"></details>
<script>window.HB_PRODUCTS=${products};<\/script>
<script>${modelJs}<\/script>
<script>${appJs}<\/script>`;
const html = ARTIFACT ? head + '\n' + body + '\n' : `<!doctype html>\n<html lang="en" dir="ltr">\n<head>\n<meta charset="utf-8">\n<meta name="viewport" content="width=device-width, initial-scale=1">\n${head}\n</head>\n<body>\n${body}\n</body>\n</html>`;
const out = path.join(__dirname, ARTIFACT ? 'artifact.html' : 'index.html');
fs.writeFileSync(out, html);
console.log('Wrote ' + out + ' (' + (html.length / 1024).toFixed(0) + ' KB), icons: ' + used.join(' '));
