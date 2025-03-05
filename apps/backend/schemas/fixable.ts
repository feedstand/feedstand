import { createSelectSchema } from 'drizzle-zod'
import { tables } from '../database/tables'

export const fixable = createSelectSchema(tables.fixables)
