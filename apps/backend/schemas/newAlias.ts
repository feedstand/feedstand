import { createInsertSchema } from 'drizzle-zod'
import { tables } from '../database/tables.ts'

export const newAlias = createInsertSchema(tables.aliases)
