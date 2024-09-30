import { createInsertSchema } from 'drizzle-zod'
import { tables } from '../database/tables'

export const newUnread = createInsertSchema(tables.unreads)
