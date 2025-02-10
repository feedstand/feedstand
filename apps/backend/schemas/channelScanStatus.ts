import { createSelectSchema } from 'drizzle-zod'
import { enums } from '../database/tables'

export const channelScanStatus = createSelectSchema(enums.channelScanStatus)
