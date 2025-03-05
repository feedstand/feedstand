import { createInsertSchema } from 'drizzle-zod'
import { tables } from '../database/tables'

export const newFixable = createInsertSchema(tables.fixables)
