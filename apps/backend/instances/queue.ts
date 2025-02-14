import { Redis } from 'ioredis'
import * as queueConstants from '../constants/queue'

export const connection = new Redis({
    host: queueConstants.host,
    port: queueConstants.port,
    username: queueConstants.user,
    password: queueConstants.pass,
    maxRetriesPerRequest: null,
    enableOfflineQueue: false, // Important settings for bulk operations.
    enableAutoPipelining: true, // Pipeline commands instead of sending them one by one.
})
