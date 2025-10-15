import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    port: 3000,
    host: true,
    strictPort: false,
    hmr: {
      overlay: true,
    },
    // Força reload completo para todos os arquivos
    watch: {
      usePolling: true,
    }
  },
  preview: {
    port: 3001,
    host: true,
    strictPort: false
  }
})