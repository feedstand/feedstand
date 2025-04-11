import { createSelectSchema } from 'drizzle-zod'
import { enums } from '../database/tables.js'

export const channelScanStatus = createSelectSchema(enums.channelScanStatus)
