import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      '/api': 'https://syncplayer-server.onrender.com',
    },
  },
  define: {
    // __API_BASE_URL__: JSON.stringify("http://localhost:5000"),
    __API_BASE_URL__: JSON.stringify("https://syncplayer-server.onrender.com"),
  },
})
