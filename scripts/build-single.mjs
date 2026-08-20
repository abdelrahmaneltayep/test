/**
 * Bundles the SPR/RFQ prototype into one HTML file, matching the offline-preview
 * convention already used by prototype.html. All CSS and JS are inlined, so the file
 * opens straight from disk; the single remaining external reference is the Google Fonts
 * stylesheet, which degrades to the declared fallback stack when there is no network.
 */
import { build } from 'vite'
import react from '@vitejs/plugin-react'
import { readFileSync, writeFileSync, rmSync, readdirSync } from 'node:fs'
import path from 'node:path'

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
      input: path.resolve('rfq.html'),
      output: { inlineDynamicImports: true, entryFileNames: 'app.js', assetFileNames: 'app.[ext]' },
    },
  },
  logLevel: 'warn',
})

// assetFileNames without a directory puts the bundle at the outDir root.
const files = readdirSync(out)
const js = readFileSync(path.join(out, files.find((f) => f.endsWith('.js'))), 'utf8')
const css = readFileSync(path.join(out, files.find((f) => f.endsWith('.css'))), 'utf8')

let html = readFileSync(path.join(out, 'rfq.html'), 'utf8')
// The replacements go through replacer functions on purpose: the minified bundle
// contains `$&` and `$\`` sequences, and String.replace would interpret those as
// substitution patterns and splice `</body>` into the middle of the JavaScript.
html = html
  .replace(/<script[^>]*src="[^"]*"[^>]*><\/script>/g, '')
  // Strip only the bundler's own stylesheet link — the Google Fonts link stays, so the
  // page uses the real typefaces online and falls back to the system stack offline.
  .replace(/<link[^>]*rel="stylesheet"[^>]*href="[^"]*assets\/[^"]*"[^>]*>/g, '')
  .replace('</head>', () => `<style>${css}</style>\n  </head>`)
  .replace('</body>', () => `<script type="module">${js}</script>\n  </body>`)

writeFileSync('rfq-prototype.html', html)
rmSync(out, { recursive: true, force: true })
console.log(`rfq-prototype.html — ${(Buffer.byteLength(html) / 1024).toFixed(0)} KB · CSS and JS inlined; the only external request is the Google Fonts stylesheet, which falls back to the system stack offline`)
