import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// Dev: proxy the CMS API + uploaded files to the Express server (port 3001),
// so the SPA can use same-origin /api and /uploads paths in every environment.
// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      '/api':     { target: 'http://localhost:3001', changeOrigin: true },
      '/uploads': { target: 'http://localhost:3001', changeOrigin: true },
    },
  },
})
