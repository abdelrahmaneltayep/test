import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: { '@': path.resolve(__dirname, './src') },
  },
  build: {
    rollupOptions: {
      input: {
        // The existing Salla prototype and the HIGHBASE SPR/RFQ prototype build side by side.
        main: path.resolve(__dirname, 'index.html'),
        rfq: path.resolve(__dirname, 'rfq.html'),
        // Design-variants sheets live alongside the prototypes they explore.
        variants: path.resolve(__dirname, 'variants.html'),
        stories: path.resolve(__dirname, 'stories.html'),
        flows: path.resolve(__dirname, 'flows.html'),
      },
    },
  },
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./src/test/setup.ts'],
  },
})
