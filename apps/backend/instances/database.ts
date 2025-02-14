import { drizzle } from 'drizzle-orm/postgres-js'
import postgres from 'postgres'
import * as databaseConstants from '../constants/database'
import * as schema from '../database/tables'

export const client = postgres({
    host: databaseConstants.host,
    port: databaseConstants.port,
    database: databaseConstants.database,
    username: databaseConstants.user,
    password: databaseConstants.password,
    max: 15,
    connect_timeout: 10,
    idle_timeout: 30,
    max_lifetime: 3600,
    keep_alive: 60,
})

export const db = drizzle(client, { schema })
