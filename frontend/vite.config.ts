import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import path from 'node:path'

export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  server: {
    host: true,          // nghe mọi network interface (cần cho tunnel)
    allowedHosts: true,  // cho phép domain tunnel (trycloudflare/ngrok) truy cập
    proxy: {
      // Mọi request /api sẽ được Vite chuyển tiếp sang backend Express.
      // Nhờ đó chỉ cần tunnel 1 cổng (frontend), backend đi kèm luôn.
      '/api': {
        target: 'http://localhost:4000',
        changeOrigin: true,
      },
    },
  },
})
