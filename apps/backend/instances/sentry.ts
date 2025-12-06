import { consoleLoggingIntegration, init } from '@sentry/node'
import { version } from '../constants/app.ts'
import { hasMigratorFeature, hasServerFeature, hasWorkerFeature } from '../constants/features.ts'
import { dsn, environment } from '../constants/sentry.ts'

export const sentry = init({
  dsn,
  environment,
  release: version,
  integrations: [consoleLoggingIntegration({ levels: ['log', 'warn', 'error'] })],
  tracesSampleRate: 0.025,
  enableLogs: true,
  initialScope: {
    tags: {
      'feature.worker': hasWorkerFeature,
      'feature.server': hasServerFeature,
      'feature.migrator': hasMigratorFeature,
    },
  },
})
