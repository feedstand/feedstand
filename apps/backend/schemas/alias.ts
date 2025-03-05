import { createSelectSchema } from 'drizzle-zod'
import { tables } from '../database/tables'

export const alias = createSelectSchema(tables.aliases)
