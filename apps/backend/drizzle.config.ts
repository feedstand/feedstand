import { defineConfig } from 'drizzle-kit'
import * as databaseConstants from './constants/database'

export default defineConfig({
    dialect: 'postgresql',
    schema: 'database/tables.ts',
    migrations: {
        table: 'migrations',
        schema: 'public',
    },
    out: 'database/migrations',
    dbCredentials: {
        host: databaseConstants.host,
        port: databaseConstants.port,
        database: databaseConstants.database,
        user: databaseConstants.user,
        password: databaseConstants.password,
    },
    verbose: true,
})
