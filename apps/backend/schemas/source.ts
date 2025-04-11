import { createSelectSchema } from 'drizzle-zod'
import { tables } from '../database/tables.js'

export const source = createSelectSchema(tables.sources)
