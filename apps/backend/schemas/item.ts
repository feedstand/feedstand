import { createSelectSchema } from 'drizzle-zod'
import { tables } from '../database/tables.ts'

export const item = createSelectSchema(tables.items)
