import { createInsertSchema } from 'drizzle-zod'
import { tables } from '../database/tables.js'

export const newItem = createInsertSchema(tables.items)
