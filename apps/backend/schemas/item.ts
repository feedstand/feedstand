import { createSelectSchema } from 'drizzle-zod'
import { tables } from '../database/tables'

export const item = createSelectSchema(tables.items)
