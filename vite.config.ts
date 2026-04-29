import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    proxy: {
      '/api': {
        target: 'http://127.0.0.1:3001',
        changeOrigin: true,
        secure: false,
      },
      '/proxy/voa': {
        target: 'https://learningenglish.voanews.com',
        changeOrigin: true,
        secure: true,
        rewrite: (path) => path.replace(/^\/proxy\/voa/, ''),
      },
      '/proxy/npr': {
        target: 'https://feeds.npr.org',
        changeOrigin: true,
        secure: true,
        rewrite: (path) => path.replace(/^\/proxy\/npr/, ''),
      },
    },
  },
})
