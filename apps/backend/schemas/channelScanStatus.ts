import { createSelectSchema } from 'drizzle-zod'
import { enums } from '../database/tables.ts'

export const channelScanStatus = createSelectSchema(enums.channelScanStatus)
