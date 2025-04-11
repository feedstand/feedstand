import { createInsertSchema } from 'drizzle-zod'
import { tables } from '../database/tables.js'

export const newChannel = createInsertSchema(tables.channels)
