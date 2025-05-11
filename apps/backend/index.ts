import { serve } from '@hono/node-server'
import { migrate } from 'drizzle-orm/postgres-js/migrator'
import * as databaseConstants from './constants/database.ts'
import { hasMigratorFeature, hasServerFeature } from './constants/features.ts'
import * as serverConstants from './constants/server.ts'
import { db } from './instances/database.ts'
import { hono } from './instances/hono.ts'

if (hasMigratorFeature) {
  await migrate(db, databaseConstants)
}

if (hasServerFeature) {
  serve({
    fetch: hono.fetch,
    hostname: serverConstants.host,
    port: serverConstants.port,
  })
}
