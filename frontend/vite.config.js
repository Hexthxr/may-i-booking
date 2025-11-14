// frontend/vite.config.js
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    host: '0.0.0.0',   // ✅ ให้เครื่องอื่นใน LAN เข้า dev server ได้
    port: 5173,        // ใช้พอร์ตเดิมของนาย
  },
})
