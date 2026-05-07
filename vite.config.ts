import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import path from 'path'

export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  // Tauri uses a fixed port
  server: {
    strictPort: true,
  },
  // Env variables starting with TAURI_ are exposed
  envPrefix: ['VITE_', 'TAURI_'],
})
