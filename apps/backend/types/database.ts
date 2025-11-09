import type { ExtractTablesWithRelations } from 'drizzle-orm'
import type { PgTransaction } from 'drizzle-orm/pg-core'
import type { PostgresJsDatabase, PostgresJsQueryResultHKT } from 'drizzle-orm/postgres-js'
import type { tables } from '../database/tables.ts'

export type Database = PostgresJsDatabase<typeof tables>

export type Transaction = PgTransaction<
  PostgresJsQueryResultHKT,
  typeof tables,
  ExtractTablesWithRelations<typeof tables>
>
