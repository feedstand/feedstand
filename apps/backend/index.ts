import { serve } from '@hono/node-server'
import { migrate } from 'drizzle-orm/postgres-js/migrator'
import { fetchOrCreateChannel } from './actions/fetchOrCreateChannel'
import * as databaseConstants from './constants/database'
import { hasMigratorFeature, hasServerFeature, hasWorkerFeature } from './constants/features'
import * as serverConstants from './constants/server'
import { importFilesFromDirectory } from './helpers/files'
import { db } from './instances/database'
import { hono } from './instances/hono'
import { scanChannel } from './jobs/scanChannel'

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

if (!hasWorkerFeature) {
    scanChannel(await fetchOrCreateChannel('https://journal.jatan.space/rss/'))
}
