import tailwind from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'
import { checker } from 'vite-plugin-checker'

export default defineConfig(({ command }) => ({
  server: {
    host: '0.0.0.0',
    port: 4000,
  },
  build: {
    emptyOutDir: true,
  },
  esbuild: {
    drop: command === 'build' ? ['console', 'debugger'] : [],
  },
  plugins: [react(), tailwind(), checker({ typescript: true })],
}))
