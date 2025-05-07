import { createSelectSchema } from 'drizzle-zod'
import { tables } from '../database/tables.ts'

export const alias = createSelectSchema(tables.aliases)
