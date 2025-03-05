import { createSelectSchema } from 'drizzle-zod'
import { enums } from '../database/tables'

export const fixableType = createSelectSchema(enums.fixableType)
