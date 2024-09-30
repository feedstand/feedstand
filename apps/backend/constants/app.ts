import 'dotenv/config'

export const env = process.env.NODE_ENV ?? 'development'
export const isDev = env === 'development'
export const isProd = env === 'production'
export const version = process.env.VERSION_TAG ?? 'unknown'
