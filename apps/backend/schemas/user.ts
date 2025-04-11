import { createSelectSchema } from 'drizzle-zod'
import { tables } from '../database/tables.js'

export const user = createSelectSchema(tables.users)
