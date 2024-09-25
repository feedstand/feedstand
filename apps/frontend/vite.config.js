import { resolve } from 'path'
import { defineConfig } from 'vite'
import { checker } from 'vite-plugin-checker'

export default defineConfig(({ command }) => ({
    server: {
        host: '0.0.0.0',
        port: 4000,
    },
    cacheDir: resolve(__dirname, '../..', 'node_modules/.cache/vite'),
    build: {
        emptyOutDir: true,
    },
    esbuild: {
        drop: command === 'build' ? ['console', 'debugger'] : [],
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
