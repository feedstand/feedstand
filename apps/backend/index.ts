import { serve } from '@hono/node-server'
import { migrate } from 'drizzle-orm/postgres-js/migrator'
import * as databaseConstants from './constants/database.js'
import { hasMigratorFeature, hasServerFeature } from './constants/features.js'
import * as serverConstants from './constants/server.js'
import { importFilesFromDirectory } from './helpers/files.js'
import { db } from './instances/database.js'
import { hono } from './instances/hono.js'

await importFilesFromDirectory('./queues')

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
