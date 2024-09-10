import { defineConfig } from 'drizzle-kit'
import * as databaseConstants from './constants.js'

export default defineConfig({
    dialect: 'postgresql',
    schema: 'database/tables.ts',
    dbCredentials: {
        host: databaseConstants.host,
        port: databaseConstants.port,
        database: databaseConstants.database,
        user: databaseConstants.user,
        password: databaseConstants.password,
    },
})
