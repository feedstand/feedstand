import { serve } from '@hono/node-server'
import { fetchOrCreateChannel } from './actions/fetchOrCreateChannel'
import { isWorker } from './constants/queue'
import * as serverConstants from './constants/server'
import { importFilesFromDirectory } from './helpers/files'
import { hono } from './instances/hono'
import { scanChannel } from './jobs/scanChannel'

await importFilesFromDirectory('./queues')

serve({
    fetch: hono.fetch,
    hostname: serverConstants.host,
    port: serverConstants.port,
})

if (!isWorker) {
    scanChannel(await fetchOrCreateChannel('https://journal.jatan.space/rss/'))
}
