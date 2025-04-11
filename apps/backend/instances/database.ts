import { drizzle } from 'drizzle-orm/postgres-js'
import postgres from 'postgres'
import * as databaseConstants from '../constants/database.js'
import { hasWorkerFeature } from '../constants/features.js'
import * as schema from '../database/tables.js'

export const client = postgres({
  host: databaseConstants.host,
  port: databaseConstants.port,
  database: databaseConstants.database,
  username: databaseConstants.user,
  password: databaseConstants.password,
  max: hasWorkerFeature ? 5 : 8,
  idle_timeout: 20,
  connect_timeout: 10,
  max_lifetime: 1800,
})

export const db = drizzle(client, { schema })
