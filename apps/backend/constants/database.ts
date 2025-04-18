export const host = process.env.DATABASE_HOST ?? ''
export const port = process.env.DATABASE_PORT ? Number(process.env.DATABASE_PORT) : undefined
export const database = process.env.DATABASE_NAME ?? ''
export const user = process.env.DATABASE_USER
export const password = process.env.DATABASE_PASS

export const dialect = 'postgresql'
export const schema = 'database/tables.ts'
export const migrationsSchema = 'public'
export const migrationsTable = 'migrations'
export const migrationsFolder = 'database/migrations'
