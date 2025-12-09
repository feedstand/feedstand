import { migrate } from 'drizzle-orm/postgres-js/migrator'
import * as databaseConstants from './constants/database.ts'
import { hasMigratorFeature, hasServerFeature } from './constants/features.ts'
import * as serverConstants from './constants/server.ts'
import { db } from './instances/database.ts'
import { hono } from './instances/hono.ts'
import { sentry } from './instances/sentry.ts'

import './queues/channel.ts'
import './queues/channels.ts'
import './queues/import.ts'

// Prevent unhandled errors from crashing worker processes.
process.on('uncaughtException', (error) => {
  console.error('[Uncaught Exception]', error)
  sentry?.captureException?.(error)
})

process.on('unhandledRejection', (error) => {
  console.error('[Unhandled Rejection]', error)
  sentry?.captureException?.(error)
})

async function main() {
  if (hasMigratorFeature) {
    await migrate(db, databaseConstants)
  }

  if (hasServerFeature) {
    Bun.serve({
      fetch: hono.fetch,
      hostname: serverConstants.host,
      port: serverConstants.port,
    })
  }
}

main().catch((error) => {
  console.error('[Fatal Error]', error)
  sentry?.captureException?.(error)
  process.exit(1)
})
