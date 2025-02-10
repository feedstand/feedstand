import { createSelectSchema } from 'drizzle-zod'
import { enums } from '../database/tables'

export const channelType = createSelectSchema(enums.channelType)
