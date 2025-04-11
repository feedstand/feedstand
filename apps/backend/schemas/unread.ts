import { createSelectSchema } from 'drizzle-zod'
import { tables } from '../database/tables.js'

export const unread = createSelectSchema(tables.unreads)
