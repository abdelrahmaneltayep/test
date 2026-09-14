/* Assembles the Highbase checkout prototype:
   tokens.css + the component CSS the page uses, both verbatim from the design
   system repo, then the prototype layer, then the icon symbols the markup
   actually references (same spriteFor mechanism the DS review pages use). */
const fs = require('fs');
const path = require('path');
const H = '/home/user/highbase-ds';
const D = '/tmp/claude-0/-home-user-test/d071304f-3298-5cba-8f5f-704a2bf6e28d/scratchpad';
const { spriteFor, CSS: ICON_CSS } = require(H + '/04_Components/_shared/sprite.js');

const PARTS = [
  '03_Tokens/dist/tokens.css',
  'atoms/Button/Button.css',
  'atoms/IconButton/IconButton.css',
  'atoms/Chip/Chip.css',
  'atoms/Checkbox/Checkbox.css',
  'atoms/RadioButton/RadioButton.css',
  'atoms/Badge/Badge.css',
  'atoms/Divider/Divider.css',
  'molecules/_base/Field.css',
  'molecules/_base/Alert.css',
  'molecules/TextField/TextField.css',
  'molecules/TextArea/TextArea.css',
  'molecules/Select/Select.css',
  'molecules/SearchField/SearchField.css',
  'molecules/InlineAlert/InlineAlert.css',
  'molecules/Banner/Banner.css',
  'molecules/Snackbar/Snackbar.css',
  'molecules/FileUpload/FileUpload.css',
  'molecules/AddToCart/AddToCart.css',
  'molecules/ListItem/ListItem.css',
  'molecules/PageHeader/PageHeader.css',
  'molecules/Tooltip/Tooltip.css',
  'molecules/DialogHeader/DialogHeader.css',
  'molecules/DialogActions/DialogActions.css',
  'organisms/Header/Header.css',
  'organisms/DataTable/DataTable.css',
  'organisms/Drawer/Drawer.css',
  'organisms/ConfirmationDialog/ConfirmationDialog.css',
  'organisms/EmptyState/EmptyState.css',
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

const head = fs.readFileSync(D + '/proto/head.html', 'utf8');
const body = fs.readFileSync(D + '/proto/body.html', 'utf8');

const out = head
  .replace('/*__DS_CSS__*/', css + '\n/* ===== icons ===== */\n' + ICON_CSS + '\n')
  + '\n' + spriteFor(body) + '\n' + body;

fs.writeFileSync(D + '/proto/highbase-checkout-proposal.html', out);
const used = [...new Set([...body.matchAll(/#hb-i-([A-Za-z]+)/g)].map(m => m[1]))].sort();
console.log('built', (out.length / 1024).toFixed(0) + ' KB |', PARTS.length, 'DS css parts |', used.length, 'icons:', used.join(' '));
