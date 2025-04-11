import { createInsertSchema } from 'drizzle-zod'
import { tables } from '../database/tables.js'

export const newUnread = createInsertSchema(tables.unreads)
