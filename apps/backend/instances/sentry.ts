import { init } from '@sentry/node'
import { nodeProfilingIntegration } from '@sentry/profiling-node'
import { version } from '../constants/app'
import { dsn, environment } from '../constants/sentry'

export const sentry = init({
  dsn,
  environment,
  release: version,
  integrations: [nodeProfilingIntegration()],
  tracesSampleRate: 1,
  profilesSampleRate: 1,
})
