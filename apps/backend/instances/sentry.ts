import { init } from '@sentry/node'
import { nodeProfilingIntegration } from '@sentry/profiling-node'
import { version } from '../constants/app.ts'
import { dsn, environment } from '../constants/sentry.ts'

export const sentry = init({
  dsn,
  environment,
  release: version,
  integrations: [nodeProfilingIntegration()],
  tracesSampleRate: 0.1,
  profilesSampleRate: 0.1,
})
