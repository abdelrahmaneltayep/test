import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

/** Single-file build: no code splitting, no hashed asset URLs to resolve. */
export default defineConfig({
  plugins: [react()],
  build: {
    outDir: 'dist-artifact',
    sourcemap: false,
    cssCodeSplit: false,
    assetsInlineLimit: 100_000_000,
    rollupOptions: {
      input: 'index.artifact.html',
      output: { inlineDynamicImports: true, entryFileNames: 'app.js', assetFileNames: 'app.[ext]' },
    },
  },
})
