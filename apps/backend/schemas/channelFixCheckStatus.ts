import { createSelectSchema } from 'drizzle-zod'
import { enums } from '../database/tables.js'

export const channelFixCheckStatus = createSelectSchema(enums.channelFixCheckStatus)
