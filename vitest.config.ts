import { defineConfig } from 'vitest/config'
import vue from '@vitejs/plugin-vue'
import { fileURLToPath, URL } from 'node:url'

export default defineConfig({
  plugins: [vue()],
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./src/pdf/__tests__/fonts.setup.ts'],
    // PDF generation tests embed 6 custom fonts via fontkit (slow under
    // jsdom + worker-less pdfjs-dist parsing); the schema-to-print test
    // generates the full vault PDF then re-parses it. 30s gives headroom
    // without masking real hangs.
    testTimeout: 30_000,
  },
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
})

