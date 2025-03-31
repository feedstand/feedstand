import type { ExtractTablesWithRelations } from 'drizzle-orm'
import type { PgTransaction } from 'drizzle-orm/pg-core'
import type { PostgresJsQueryResultHKT } from 'drizzle-orm/postgres-js'
import type { tables } from '../database/tables'

export type Transaction = PgTransaction<
  PostgresJsQueryResultHKT,
  typeof tables,
  ExtractTablesWithRelations<typeof tables>
>
