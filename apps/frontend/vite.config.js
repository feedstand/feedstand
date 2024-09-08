import { resolve } from 'path'
import { defineConfig } from 'vite'
import { checker } from 'vite-plugin-checker'

export default defineConfig(({ command }) => ({
    server: {
        port: 4000,
    },
    cacheDir: resolve(__dirname, '../..', 'node_modules/.cache/vite'),
    build: {
        emptyOutDir: true,
        target: 'esnext',
    },
    esbuild: {
        drop: command === 'serve' ? [] : ['console', 'debugger'],
    },
    resolve: {
        alias: {
            '~': resolve(__dirname),
        },
    },
    plugins: [
        checker({
            typescript: true,
        }),
    ],
}))
