import { createInsertSchema } from 'drizzle-zod'
import { tables } from '../database/tables'

export const newItemNoChannel = createInsertSchema(tables.items).omit({ channelId: true })
