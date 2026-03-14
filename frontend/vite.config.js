import { fileURLToPath, URL } from 'node:url'
import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [vue()],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url))
    }
  },
  server: {
    // อนุญาตโดเมน Ngrok
    allowedHosts: [
      'gerald-unstressed-unecliptically.ngrok-free.dev'
    ],
    // ✅ ตั้ง Proxy ไปหา Backend โดยใช้ 127.0.0.1 (ชัวร์กว่า localhost)
    proxy: {
      '/api': {
        target: 'http://127.0.0.1:3000',
        changeOrigin: true,
        secure: false,
      },
      '/socket.io': {
        target: 'http://127.0.0.1:3000',
        changeOrigin: true,
        secure: false,
        ws: true,
      }
    }
  }
})