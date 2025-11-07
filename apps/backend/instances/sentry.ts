import { init } from '@sentry/node'
import { nodeProfilingIntegration } from '@sentry/profiling-node'
import { version } from '../constants/app.ts'
import { hasMigratorFeature, hasServerFeature, hasWorkerFeature } from '../constants/features.ts'
import { dsn, environment } from '../constants/sentry.ts'

export const sentry = init({
  dsn,
  environment,
  release: version,
  integrations: [nodeProfilingIntegration()],
  tracesSampleRate: 0.1,
  profilesSampleRate: 1.0,
  enableLogs: true,
  initialScope: {
    tags: {
      'feature.worker': hasWorkerFeature,
      'feature.server': hasServerFeature,
      'feature.migrator': hasMigratorFeature,
    },
  },
})
