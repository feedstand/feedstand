import { createSelectSchema } from 'drizzle-zod'
import { enums } from '../database/tables'

export const channelFixCheckStatus = createSelectSchema(enums.channelFixCheckStatus)
