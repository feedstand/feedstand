export const env = import.meta.env.MODE ?? 'development'
export const isDev = env === 'development'
export const isProd = env === 'production'
export const version = import.meta.env.VITE_VERSION_TAG ?? 'unknown'
