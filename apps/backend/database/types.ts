import { InferInsertModel, InferSelectModel } from 'drizzle-orm'
import { users, channels, items, sources, unreads } from './tables.js'

export type User = InferSelectModel<typeof users>
export type NewUser = InferInsertModel<typeof users>
export type Channel = InferSelectModel<typeof channels>
export type NewChannel = InferInsertModel<typeof channels>
export type Item = InferSelectModel<typeof items>
export type NewItem = InferInsertModel<typeof items>
export type Source = InferSelectModel<typeof sources>
export type NewSource = InferInsertModel<typeof sources>
export type Unread = InferSelectModel<typeof unreads>
export type NewUnread = InferInsertModel<typeof unreads>
