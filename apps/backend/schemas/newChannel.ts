import { createInsertSchema } from 'drizzle-zod'
import { tables } from '../database/tables.ts'

export const newChannel = createInsertSchema(tables.channels)
