import { serve } from '@hono/node-server'
import * as serverConstants from './constants/server'
import { importFilesFromDirectory } from './helpers/files'
import { hono } from './instances/hono'

await importFilesFromDirectory('./queues')

console.log(process.env)

serve({
    fetch: hono.fetch,
    hostname: serverConstants.host,
    port: serverConstants.port,
})
