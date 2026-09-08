/**
 * Bundle the billing prototype into one file.
 *
 * The multi-file build is four pages sharing five scripts. An artifact is one page, so the
 * bundle carries all four surfaces and picks one by `?role=`. Nothing about the surfaces
 * changes: they are already named apps rather than self-running scripts, and every
 * cross-surface link already goes through `pageHref`, which reads `HB_SINGLE` to decide
 * which shape of link to write.
 *
 *   node scripts/build-billing.mjs            -> billing-prototype.html + the artifact fragment
 */
import { readFileSync, writeFileSync } from 'node:fs'

const read = (f) => readFileSync(new URL('../billing/' + f, import.meta.url), 'utf8')

const SCRIPTS = ['data.js', 'strings.js', 'selftest.js', 'ui.js', 'picker.js', 'seller.js', 'admin.js', 'buyer.js']

const boot = `
/*
 * Start whichever surface the URL asks for, and be able to do it again.
 *
 * In the multi-file build the page decides which app runs. Here the query does, and
 * because the bundle switches surface without navigating, starting has to be repeatable:
 * tear down whatever is mounted, drop any open drawer, and start the next one. The role is
 * stamped on <body> first because the buyer's invariant-2 check reads it.
 */
window.HBBoot = function () {
  HBUI.closeDrawer()
  var kids = Array.prototype.slice.call(document.body.children)
  for (var i = 0; i < kids.length; i++) if (kids[i].tagName !== 'SCRIPT') kids[i].remove()
  document.body.style.overflow = ''
  var role = new URLSearchParams(location.search).get('role')
  if (['buyer', 'seller', 'admin'].indexOf(role) < 0) role = null
  document.body.setAttribute('data-role', role || 'picker')
  HBApps[role || 'picker'](HB, HBStrings, HBUI)
}
window.HBBoot()
`

const head = [
  '<title>Highbase Billing Module</title>',
  '<link rel="preconnect" href="https://fonts.googleapis.com" />',
  '<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />',
  '<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=Jost:wght@300;400;500&display=swap" />',
  '<style>\n' + read('styles.css') + '\n</style>',
].join('\n')

// HB_SINGLE has to be set before ui.js is evaluated, since pageHref closes over the global.
const body = [
  '<script>window.HB_SINGLE = true</script>',
  ...SCRIPTS.map((f) => '<script>\n' + read(f) + '\n</script>'),
  '<script>' + boot + '</script>',
].join('\n')

// Standalone: opens from the filesystem.
writeFileSync(new URL('../billing-prototype.html', import.meta.url),
  `<!doctype html>
<html lang="en" dir="ltr">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
${head}
  </head>
  <body>
${body}
  </body>
</html>
`)

// Fragment: the artifact host supplies the skeleton, so this is head content then body content.
writeFileSync(new URL('../.billing-artifact.html', import.meta.url), head + '\n' + body + '\n')

const kb = (s) => Math.round(s.length / 1024)
console.log('billing-prototype.html — ' + kb(readFileSync(new URL('../billing-prototype.html', import.meta.url), 'utf8')) + ' KB')
console.log('.billing-artifact.html — ' + kb(readFileSync(new URL('../.billing-artifact.html', import.meta.url), 'utf8')) + ' KB')
