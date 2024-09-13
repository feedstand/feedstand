import { Redis } from 'ioredis'
import * as queueConstants from './constants.js'

export const connection = new Redis({
    host: queueConstants.host,
    port: queueConstants.port,
})
