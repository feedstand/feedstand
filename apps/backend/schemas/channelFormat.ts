import { createSelectSchema } from 'drizzle-zod'
import { enums } from '../database/tables.ts'

export const channelFormat = createSelectSchema(enums.channelFormat)
