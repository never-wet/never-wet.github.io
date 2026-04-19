import path from 'node:path'
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  base: './',
  plugins: [react()],
  build: {
    rollupOptions: {
      input: path.resolve(__dirname, 'dev.html'),
    },
    // Browser ML and 3D graph tooling are intentionally heavy; lazy panels already
    // split the largest tools, so we raise the warning threshold to reduce noise.
    chunkSizeWarningLimit: 1800,
  },
})
