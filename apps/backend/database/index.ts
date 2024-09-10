import postgres from 'postgres'
import { drizzle } from 'drizzle-orm/postgres-js'
import * as databaseConstants from './constants.js'

export const client = postgres({
    host: databaseConstants.host,
    port: databaseConstants.port,
    database: databaseConstants.database,
    username: databaseConstants.user,
    password: databaseConstants.password,
})
export const db = drizzle(client)
