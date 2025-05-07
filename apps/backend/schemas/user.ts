import { createSelectSchema } from 'drizzle-zod'
import { tables } from '../database/tables.ts'

export const user = createSelectSchema(tables.users)
