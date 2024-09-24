import { serve } from '@hono/node-server'
import * as serverConstants from '~/constants/server'
import { hono } from './instances/hono'
import { importFilesFromDirectory } from './helpers/files'

await importFilesFromDirectory('./routes')

serve({
    fetch: hono.fetch,
    hostname: serverConstants.host,
    port: serverConstants.port,
})
