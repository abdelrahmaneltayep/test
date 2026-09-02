/**
 * Bundles an entry into one HTML file, matching the offline-preview convention already
 * used by prototype.html. Pass the entry name as an argument:
 *
 *   node scripts/build-single.mjs rfq        -> rfq-prototype.html
 *   node scripts/build-single.mjs variants   -> variants-prototype.html
 *   node scripts/build-single.mjs matching   -> matching-change-sheet.html
 *
 * All CSS and JS are inlined, so the file opens straight from disk; the single remaining
 * external reference is the Google Fonts stylesheet, which degrades to the declared
 * fallback stack when there is no network.
 *
 * Not every entry is a prototype, and the filename has to say which is which. Calling the
 * change sheet `matching-prototype.html` sent someone to a document expecting a clickable
 * app — the file is what gets downloaded and forwarded, so its name is the only label it
 * carries once it is off this machine.
 */
import { build } from 'vite'
import react from '@vitejs/plugin-react'
import { readFileSync, writeFileSync, rmSync, readdirSync } from 'node:fs'
import path from 'node:path'

const entry = process.argv[2] ?? 'rfq'
/** Entries that are documents rather than prototypes, and what to call their file. */
const SUFFIX = { matching: 'change-sheet' }
const outFile = `${entry}-${SUFFIX[entry] ?? 'prototype'}.html`
const out = path.resolve('.single-build')
rmSync(out, { recursive: true, force: true })

await build({
  configFile: false,
  plugins: [react()],
  resolve: { alias: { '@': path.resolve('./src') } },
  build: {
    outDir: out,
    emptyOutDir: true,
    rollupOptions: {
      input: path.resolve(`${entry}.html`),
      output: { inlineDynamicImports: true, entryFileNames: 'app.js', assetFileNames: 'app.[ext]' },
    },
  },
  logLevel: 'warn',
})

// assetFileNames without a directory puts the bundle at the outDir root.
const files = readdirSync(out)
const js = readFileSync(path.join(out, files.find((f) => f.endsWith('.js'))), 'utf8')
const css = readFileSync(path.join(out, files.find((f) => f.endsWith('.css'))), 'utf8')

let html = readFileSync(path.join(out, `${entry}.html`), 'utf8')
// The replacements go through replacer functions on purpose: the minified bundle
// contains `$&` and `$\`` sequences, and String.replace would interpret those as
// substitution patterns and splice `</body>` into the middle of the JavaScript.
html = html
  .replace(/<script[^>]*src="[^"]*"[^>]*><\/script>/g, '')
  // Strip only the bundler's own stylesheet link — the Google Fonts link stays, so the
  // page uses the real typefaces online and falls back to the system stack offline.
  // Any *local* stylesheet link: the bundle's CSS is inlined below, so the link is a
  // guaranteed 404 wherever the file is opened. Matching on `assets/` missed it, because
  // assetFileNames puts the file at the output root.
  .replace(/<link[^>]*rel="stylesheet"[^>]*href="(?!https?:)[^"]*"[^>]*>/g, '')
  .replace('</head>', () => `<style>${css}</style>\n  </head>`)
  .replace('</body>', () => `<script type="module">${js}</script>\n  </body>`)

writeFileSync(outFile, html)
rmSync(out, { recursive: true, force: true })
console.log(`${outFile} — ${(Buffer.byteLength(html) / 1024).toFixed(0)} KB · CSS and JS inlined; the only external request is the Google Fonts stylesheet, which falls back to the system stack offline`)
