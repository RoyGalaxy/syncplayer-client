import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      '/api': 'http://localhost:5000',
    },
    allowedHosts: ['local.pixel7.com']
  },
  define: {
    __API_BASE_URL__: JSON.stringify("http://localhost:5000"),
    // __API_BASE_URL__: JSON.stringify("http://10.63.37.26:5000"),
    // __API_BASE_URL__: JSON.stringify("https://4g1tpx6g-5000.inc1.devtunnels.ms"),
  },
})
