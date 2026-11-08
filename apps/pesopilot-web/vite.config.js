import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': '/src',
    },
  },
  build: {
    // Retain Vite 5's browser targets rather than raising them on upgrade.
    target: ['es2020', 'edge88', 'firefox78', 'chrome87', 'safari14'],
    rollupOptions: {
      output: {
        manualChunks: {
          'react-vendor': [
            'react',
            'react-dom',
            'react-router-dom',
          ],
        },
      },
    },
  },
  test: {
    // Preserve the existing mock lifecycle across the Vitest 5 migration.
    clearMocks: false,
    setupFiles: ['./src/test/setup.js'],
  },
})
