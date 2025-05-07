import { createInsertSchema } from 'drizzle-zod'
import { tables } from '../database/tables.ts'

export const newFixable = createInsertSchema(tables.fixables)
