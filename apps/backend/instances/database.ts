import { drizzle } from 'drizzle-orm/postgres-js'
import postgres from 'postgres'
import * as databaseConstants from '../constants/database.ts'
import { hasWorkerFeature } from '../constants/features.ts'
import * as schema from '../database/tables.ts'

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
