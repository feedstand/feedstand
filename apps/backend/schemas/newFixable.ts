import { createInsertSchema } from 'drizzle-zod'
import { tables } from '../database/tables.js'

export const newFixable = createInsertSchema(tables.fixables)
