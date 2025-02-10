import { createSelectSchema } from 'drizzle-zod'
import { enums } from '../database/tables'

export const channelJobStatus = createSelectSchema(enums.channelJobStatus)
