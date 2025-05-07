import { createSelectSchema } from 'drizzle-zod'
import { tables } from '../database/tables.ts'

export const fixable = createSelectSchema(tables.fixables)
