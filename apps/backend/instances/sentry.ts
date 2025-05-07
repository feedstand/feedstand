// import { init } from '@sentry/node'
// import { nodeProfilingIntegration } from '@sentry/profiling-node'
// import { version } from '../constants/app.ts'
// import { dsn, environment } from '../constants/sentry.ts'

// export const sentry = init({
//   dsn,
//   environment,
//   release: version,
//   // integrations: [nodeProfilingIntegration()],
//   tracesSampleRate: 1,
//   profilesSampleRate: 1,
// })

import type { NodeClient } from '@sentry/node'

// INFO: Sentry is disabled for now until it works fine with Node and its native TS support.
export const sentry = {} as NodeClient
