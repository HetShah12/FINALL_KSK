// frontend/vite.config.js
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173, // Or your preferred frontend port
    proxy: {
      '/api': {
        target: 'http://localhost:5001', // Points to your backend
        changeOrigin: true,
        // secure: false, // If backend is not HTTPS and you have issues
      }
    }
  }
})