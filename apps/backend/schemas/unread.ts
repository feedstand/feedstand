import { createSelectSchema } from 'drizzle-zod'
import { tables } from '../database/tables'

export const unread = createSelectSchema(tables.unreads)
