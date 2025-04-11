import { createSelectSchema } from 'drizzle-zod'
import { tables } from '../database/tables.js'

export const item = createSelectSchema(tables.items)
