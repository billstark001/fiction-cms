import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { vanillaExtractPlugin } from '@vanilla-extract/vite-plugin'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react(), vanillaExtractPlugin()],
  server: {
    proxy: {
      '/api': {
        target: 'http://localhost:3001',
        changeOrigin: true,
      }
    }
  },
  build: {
    outDir: 'dist'
  }
})