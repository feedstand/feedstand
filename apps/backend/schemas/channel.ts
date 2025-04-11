import { createSelectSchema } from 'drizzle-zod'
import { tables } from '../database/tables.js'

export const channel = createSelectSchema(tables.channels)
