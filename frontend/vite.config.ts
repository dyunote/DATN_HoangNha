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
  // Proxy /api -> backend Express, dùng chung cho cả dev lẫn preview.
  server: {
    host: true,          // nghe mọi network interface (cần cho tunnel)
    allowedHosts: true,  // cho phép domain tunnel (trycloudflare/ngrok) truy cập
    proxy: {
      '/api': { target: 'http://localhost:4000', changeOrigin: true },
      // Ảnh admin upload nằm ở backend/uploads, serve tĩnh tại /uploads
      '/uploads': { target: 'http://localhost:4000', changeOrigin: true },
    },
  },
  // preview = serve bản build (dist). Đây là chế độ nên dùng khi share qua tunnel:
  // code đã gom thành vài file, tải nhanh, không bị hủy request như dev mode.
  preview: {
    host: true,
    allowedHosts: true,
    proxy: {
      '/api': { target: 'http://localhost:4000', changeOrigin: true },
      // Ảnh admin upload nằm ở backend/uploads, serve tĩnh tại /uploads
      '/uploads': { target: 'http://localhost:4000', changeOrigin: true },
    },
  },
})
