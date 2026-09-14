/* Builds the self-contained checkout prototype.
   Usage:  node build.js [path-to-highbase-ds]
   Default DS path is ../../../highbase-ds, override with $HIGHBASE_DS or argv[2].

   Output: index.html — one file, no network except the two web fonts. */
const fs = require('fs');
const path = require('path');

const DS = process.argv[2] || process.env.HIGHBASE_DS ||
  path.resolve(__dirname, '../../../highbase-ds');

if (!fs.existsSync(path.join(DS, '03_Tokens/dist/tokens.css'))) {
  console.error('Cannot find the Highbase design system at: ' + DS);
  console.error('Pass it explicitly:  node build.js /path/to/highbase-ds');
  process.exit(1);
}

const read = p => fs.readFileSync(path.join(DS, p), 'utf8');

// Only the components this prototype actually uses. _base first — Field.css and
// Alert.css carry the shared field/alert foundations the others build on.
const COMPONENTS = [
  '04_Components/molecules/_base/Field.css',
  '04_Components/molecules/_base/Alert.css',
  '04_Components/atoms/Button/Button.css',
  '04_Components/atoms/IconButton/IconButton.css',
  '04_Components/atoms/Checkbox/Checkbox.css',
  '04_Components/atoms/Badge/Badge.css',
  '04_Components/atoms/Chip/Chip.css',
  '04_Components/molecules/TextField/TextField.css',
  '04_Components/molecules/Select/Select.css',
  '04_Components/molecules/InlineAlert/InlineAlert.css',
  '04_Components/molecules/Snackbar/Snackbar.css',
  '04_Components/molecules/DialogActions/DialogActions.css',
  '04_Components/molecules/DialogHeader/DialogHeader.css',
  '04_Components/organisms/ConfirmationDialog/ConfirmationDialog.css'
];

const tokens = read('03_Tokens/dist/tokens.css');
const dsCss = COMPONENTS.map(f => `/* ==== ${path.basename(f)} ==== */\n` + read(f)).join('\n');
const protoCss = fs.readFileSync(path.join(__dirname, 'proto.css'), 'utf8');
const appJs = fs.readFileSync(path.join(__dirname, 'app.js'), 'utf8');

// The prototype renders from JS, so ship the whole sprite rather than
// scanning static markup for #hb-i-* references.
const { SPRITE, NAMES } = require(path.join(DS, '05_Icons/ui.js'));
const iconCss = `.hb-i{width:1em;height:1em;display:inline-block;fill:currentColor;flex:0 0 auto}
[dir="rtl"] [data-mirror]>.hb-i,[dir="rtl"] .hb-i[data-mirror]{transform:scaleX(-1)}`;

// Icons the app asks for, checked against the library so a typo fails the build
// rather than rendering an invisible glyph. app.js builds the href by
// concatenation, so scan the ic('name') call sites, not the finished markup.
const used = [...new Set([...appJs.matchAll(/\bic\(\s*['"]([A-Za-z]+)['"]/g)].map(m => m[1]))];
if (!used.length) {
  console.error('No ic() calls found — the icon check is not looking at the right thing.');
  process.exit(1);
}
const missing = used.filter(k => !(k in NAMES));
if (missing.length) {
  console.error('Unknown icon key(s): ' + missing.join(', '));
  console.error('Valid keys are in 05_Icons/README.md');
  process.exit(1);
}

const html = `<!doctype html>
<html lang="en" dir="ltr">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Highbase — Checkout proposal</title>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Public+Sans:wght@400;500;600;700;800&family=Noto+Kufi+Arabic:wght@400;500;600;700&display=swap">
<style>
${tokens}
${dsCss}
${iconCss}
${protoCss}
</style>
</head>
<body>
${SPRITE}
<script>
${appJs}
<\/script>
</body>
</html>`;

const out = path.join(__dirname, 'index.html');
fs.writeFileSync(out, html);
console.log('Wrote ' + out + '  (' + (html.length / 1024).toFixed(0) + ' KB)');
console.log('Icons used: ' + used.length + ' of ' + Object.keys(NAMES).length + ' — all resolved.');
