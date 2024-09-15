import { Redis } from 'ioredis'
import * as queueConstants from '~/constants/queue.js'

export const connection = new Redis({
    host: queueConstants.host,
    port: queueConstants.port,
    maxRetriesPerRequest: null,
})
