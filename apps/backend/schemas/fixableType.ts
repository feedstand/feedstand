import { createSelectSchema } from 'drizzle-zod'
import { enums } from '../database/tables.js'

export const fixableType = createSelectSchema(enums.fixableType)
