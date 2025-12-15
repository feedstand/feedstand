import tailwind from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'
import { checker } from 'vite-plugin-checker'

export default defineConfig(({ command }) => ({
  server: {
    host: '0.0.0.0',
    port: 3000,
  },
  build: {
    emptyOutDir: true,
    // TODO: Add drop_console when Vite 8 stable supports it via rolldown.
  },
  plugins: [
    react(),
    tailwind(),
    // Checker enabled only during serve.
    // See: https://github.com/fi3ework/vite-plugin-checker/issues/428.
    command === 'serve' && checker({ typescript: true }),
  ],
}))
