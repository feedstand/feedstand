import { createInsertSchema } from 'drizzle-zod'
import { tables } from '../database/tables'

export const newItem = createInsertSchema(tables.items)
