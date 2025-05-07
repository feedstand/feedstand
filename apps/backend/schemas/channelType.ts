import { createSelectSchema } from 'drizzle-zod'
import { enums } from '../database/tables.ts'

export const channelType = createSelectSchema(enums.channelType)
