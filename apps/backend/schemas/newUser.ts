import { createInsertSchema } from 'drizzle-zod'
import { tables } from '../database/tables'

export const newUser = createInsertSchema(tables.users)
