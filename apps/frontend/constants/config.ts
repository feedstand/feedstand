// biome-ignore lint/suspicious/noExplicitAny: Assume window has __CONFIG__.
const windowConfig = (window as any).__CONFIG__ ?? {}

export const apiUrl = windowConfig.apiUrl ?? import.meta.env.VITE_API_URL ?? ''
export const sentryDsn = windowConfig.sentryDsn ?? import.meta.env.VITE_SENTRY_DSN ?? ''
export const sentryEnv = windowConfig.sentryEnv ?? import.meta.env.VITE_SENTRY_ENV ?? ''
