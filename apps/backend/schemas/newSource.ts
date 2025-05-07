import { createInsertSchema } from 'drizzle-zod'
import { tables } from '../database/tables.ts'

export const newSource = createInsertSchema(tables.sources)
