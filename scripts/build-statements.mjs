/**
 * Bundle the statements prototype into one file.
 *
 * The multi-file build is four pages sharing six scripts. An artifact is one page, so the
 * bundle carries all four surfaces and picks one by `?role=`. Nothing about the surfaces
 * changes: each is already a named app rather than a self-running script, and every
 * cross-role link goes through pageHref, which reads HBS_SINGLE to decide its shape.
 *
 *   node scripts/build-statements.mjs   ->  statements-prototype.html + the artifact fragment
 */
import { readFileSync, writeFileSync } from 'node:fs'

const read = (f) => readFileSync(new URL('../statements/' + f, import.meta.url), 'utf8')

const SCRIPTS = ['data.js', 'strings.js', 'selftest.js', 'ui.js', 'picker.js', 'seller.js', 'admin.js', 'buyer.js']
const FONTS = 'https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=Jost:wght@300;400;500&display=swap'
const CSS = read('styles.css')

/*
 * A page that renders with no stylesheet looks broken rather than unstyled, and the
 * reader has no way to tell which. This element is styled inline — the last thing a host
 * is likely to strip — and the stylesheet's own `#hs-css-check { display: none }` hides
 * it. So it appears only when the CSS genuinely did not apply, and says so.
 */
const cssCheck = `<div id="hs-css-check" style="margin:0;padding:14px 18px;background:#fff5e6;border-bottom:2px solid #fe8e00;color:#a35c00;font:14px/1.5 system-ui,sans-serif">
<strong style="display:block;color:#021a37">This page's stylesheet did not load.</strong>
The prototype below is working — every figure is computed — but it is rendering unstyled, which is a problem with how this page is being displayed rather than with the prototype. Opening <code>statements/index.html</code> from the repository shows it as designed.
</div>`

const boot = `
/*
 * Start whichever surface the URL asks for, and be able to do it again.
 *
 * In the multi-file build the page decides which app runs; here the query does. Because
 * the bundle switches surface without navigating, starting has to be repeatable: close
 * any open drawer, tear down what is mounted, and start the next one.
 */
window.HBSBoot = function () {
  HBSUI.closeDrawer()
  var kids = Array.prototype.slice.call(document.body.children)
  for (var i = 0; i < kids.length; i++) if (kids[i].tagName !== 'SCRIPT' && kids[i].id !== 'hs-css-check') kids[i].remove()
  document.body.style.overflow = ''
  var role = new URLSearchParams(location.search).get('role')
  if (['buyer', 'seller', 'admin'].indexOf(role) < 0) role = null
  document.body.setAttribute('data-role', role || 'picker')
  HBSApps[role || 'picker']()
}
window.HBSBoot()
`

/*
 * The fragment carries its stylesheet as a string and installs it in document.head
 * itself, rather than relying on a <style> tag surviving wherever the fragment is
 * embedded. `<` is escaped so no run of characters in the CSS can close the script early.
 */
const inject = `
;(function () {
  var link = document.createElement('link')
  link.rel = 'stylesheet'
  link.href = ${JSON.stringify(FONTS)}
  document.head.appendChild(link)
  var style = document.createElement('style')
  style.textContent = ${JSON.stringify(CSS).replace(/</g, '\\u003c')}
  document.head.appendChild(style)
})()
`

// HBS_SINGLE must be set before ui.js is evaluated: pageHref closes over the global.
const body = [
  '<script>window.HBS_SINGLE = true</script>',
  ...SCRIPTS.map((f) => '<script>\n' + read(f) + '\n</script>'),
  '<script>' + boot + '</script>',
].join('\n')

const head = [
  '<title>HIGHBASE Billing — statements</title>',
  '<link rel="preconnect" href="https://fonts.googleapis.com" />',
  '<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />',
  '<link rel="stylesheet" href="' + FONTS + '" />',
  '<style>\n' + CSS + '\n</style>',
].join('\n')

writeFileSync(new URL('../statements-prototype.html', import.meta.url),
  `<!doctype html>
<html lang="en" dir="ltr">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
${head}
  </head>
  <body>
${cssCheck}
${body}
  </body>
</html>
`)

// Fragment: the host supplies the skeleton, so the styling has to install itself.
writeFileSync(new URL('../.statements-artifact.html', import.meta.url),
  '<title>HIGHBASE Billing — statements</title>\n<script>' + inject + '</script>\n' + cssCheck + '\n' + body + '\n')

const kb = (u) => Math.round(readFileSync(new URL(u, import.meta.url), 'utf8').length / 1024)
console.log('statements-prototype.html — ' + kb('../statements-prototype.html') + ' KB')
console.log('.statements-artifact.html — ' + kb('../.statements-artifact.html') + ' KB')
