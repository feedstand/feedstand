import { createInsertSchema } from 'drizzle-zod'
import { tables } from '../database/tables'

export const newAlias = createInsertSchema(tables.aliases)
