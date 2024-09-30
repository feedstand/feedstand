import { createSelectSchema } from 'drizzle-zod'
import { tables } from '../database/tables'

export const channel = createSelectSchema(tables.channels)
