import { migrate } from 'drizzle-orm/postgres-js/migrator'
import * as databaseConstants from './constants/database.ts'
import { hasMigratorFeature, hasServerFeature } from './constants/features.ts'
import { db } from './instances/database.ts'
import { hono } from './instances/hono.ts'
import { sentry } from './instances/sentry.ts'

import './queues/channel.ts'
import './queues/channels.ts'
import './queues/import.ts'

async function main() {
  if (hasMigratorFeature) {
    await migrate(db, databaseConstants)
  }

  if (hasServerFeature) {
    Bun.serve({
      fetch: hono.fetch,
      hostname: '0.0.0.0',
      port: 3000,
    })
  }
}

main().catch((error) => {
  console.error('[Fatal Error]', error)
  sentry?.captureException?.(error)
  process.exit(1)
})
