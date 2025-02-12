import { serve } from '@hono/node-server'
import { migrate } from 'drizzle-orm/postgres-js/migrator'
import * as databaseConstants from './constants/database'
import { hasMigratorFeature, hasServerFeature, hasWorkerFeature } from './constants/features'
import * as serverConstants from './constants/server'
import { importFilesFromDirectory } from './helpers/files'
import { db } from './instances/database'
import { hono } from './instances/hono'

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

if (hasWorkerFeature) {
    const logMemoryInfo = () => {
        const used = process.memoryUsage()
        console.log({
            rss: Math.round(used.rss / 1024 / 1024),
            heapTotal: Math.round(used.heapTotal / 1024 / 1024),
            heapUsed: Math.round(used.heapUsed / 1024 / 1024),
            external: Math.round(used.external / 1024 / 1024),
        })
    }

    process.on('SIGTERM', logMemoryInfo)
    process.on('SIGINT', logMemoryInfo)

    setInterval(logMemoryInfo, 10000)
}
