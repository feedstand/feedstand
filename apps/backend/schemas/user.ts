import { createSelectSchema } from 'drizzle-zod'
import { tables } from '../database/tables'

export const user = createSelectSchema(tables.users)
