/* Assembles the Highbase checkout-verification & payment prototype:
   tokens.css + the component CSS the page uses, both verbatim from the design
   system repo, then the prototype layer, then the icon symbols the markup
   actually references (same spriteFor mechanism the DS review pages use).
   Everything is resolved relative to this file, so it runs from the repo. */
const fs = require('fs');
const path = require('path');
const H = process.env.HIGHBASE_DS || '/home/user/highbase-ds';
const D = __dirname;
const { spriteFor, CSS: ICON_CSS } = require(H + '/04_Components/_shared/sprite.js');

const PARTS = [
  '03_Tokens/dist/tokens.css',
  'atoms/Button/Button.css',
  'atoms/IconButton/IconButton.css',
  'atoms/Chip/Chip.css',
  'atoms/Checkbox/Checkbox.css',
  'atoms/RadioButton/RadioButton.css',
  'atoms/Avatar/Avatar.css',
  'atoms/Badge/Badge.css',
  'atoms/Logo/Logo.css',
  'atoms/Divider/Divider.css',
  'molecules/_base/Field.css',
  'molecules/_base/Alert.css',
  'molecules/TextField/TextField.css',
  'molecules/TextArea/TextArea.css',
  'molecules/PhoneField/PhoneField.css',
  'molecules/Select/Select.css',
  'molecules/SearchField/SearchField.css',
  'molecules/InlineAlert/InlineAlert.css',
  'molecules/Banner/Banner.css',
  'molecules/Snackbar/Snackbar.css',
  'molecules/FileUpload/FileUpload.css',
  'molecules/ListItem/ListItem.css',
  'molecules/StatCard/StatCard.css',
  'molecules/PageHeader/PageHeader.css',
  'molecules/Tooltip/Tooltip.css',
  'molecules/DialogHeader/DialogHeader.css',
  'molecules/DialogActions/DialogActions.css',
  'organisms/Header/Header.css',
  'organisms/DataTable/DataTable.css',
  'organisms/Drawer/Drawer.css',
  'organisms/ConfirmationDialog/ConfirmationDialog.css',
  'organisms/EmptyState/EmptyState.css',
  'organisms/Footer/Footer.css',
  'organisms/ScrollToTop/ScrollToTop.css',
];

const resolve = p => p.startsWith('03_Tokens') ? path.join(H, p) : path.join(H, '04_Components', p);

let css = '';
const missing = [];
for (const p of PARTS) {
  const f = resolve(p);
  if (!fs.existsSync(f)) { missing.push(p); continue; }
  const body = fs.readFileSync(f, 'utf8');
  // An unterminated comment silently kills a whole stylesheet — the DS has been
  // bitten by this, so refuse to ship a part whose comments do not balance.
  const opens = (body.match(/\/\*/g) || []).length, closes = (body.match(/\*\//g) || []).length;
  if (opens !== closes) { console.error('UNBALANCED COMMENTS in ' + p); process.exit(1); }
  css += `\n/* ===== ${p} (verbatim, highbase-ds) ===== */\n` + body + '\n';
}
if (missing.length) { console.error('MISSING PARTS: ' + missing.join(', ')); process.exit(1); }

const head = fs.readFileSync(path.join(D, 'head.html'), 'utf8');
const body = fs.readFileSync(path.join(D, 'body.html'), 'utf8');

const out = head
  .replace('/*__DS_CSS__*/', css + '\n/* ===== icons ===== */\n' + ICON_CSS + '\n')
  + '\n' + spriteFor(body) + '\n' + body;

fs.writeFileSync(path.join(D, 'highbase-verification-proposal.html'), out);
const used = [...new Set([...body.matchAll(/#hb-i-([A-Za-z]+)/g)].map(m => m[1]))].sort();
console.log('built', (out.length / 1024).toFixed(0) + ' KB |', PARTS.length, 'DS css parts |', used.length, 'icons:', used.join(' '));
