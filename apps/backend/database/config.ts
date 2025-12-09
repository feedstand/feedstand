import { defineConfig } from 'drizzle-kit'
import * as databaseConstants from '../constants/database.ts'

export default defineConfig({
  dialect: databaseConstants.dialect,
  schema: databaseConstants.schema,
  migrations: {
    schema: databaseConstants.migrationsSchema,
    table: databaseConstants.migrationsTable,
  },
  out: databaseConstants.migrationsFolder,
  dbCredentials: {
    host: databaseConstants.host,
    port: databaseConstants.port,
    database: databaseConstants.database,
    user: databaseConstants.user,
    password: databaseConstants.password,
  },
  verbose: true,
})
