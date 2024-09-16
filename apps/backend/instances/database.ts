import postgres from 'postgres'
import { drizzle } from 'drizzle-orm/postgres-js'
import * as databaseConstants from '~/constants/database.js'
import * as schema from '~/database/tables.js'

export const client = postgres({
    host: databaseConstants.host,
    port: databaseConstants.port,
    database: databaseConstants.database,
    username: databaseConstants.user,
    password: databaseConstants.password,
})

export const db = drizzle(client, { schema })
