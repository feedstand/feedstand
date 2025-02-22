import { Redis } from 'ioredis'
import * as queueConstants from '../constants/queue'

export const connection = new Redis({
  host: queueConstants.host,
  port: queueConstants.port,
  username: queueConstants.user,
  password: queueConstants.pass,
  maxRetriesPerRequest: null,
})
