import { tables } from '~/database/tables'

export type Table = (typeof tables)[keyof typeof tables]

export type User = (typeof tables.users)['$inferSelect']

export type NewUser = (typeof tables.users)['$inferInsert']

export type Channel = (typeof tables.channels)['$inferSelect']

export type NewChannel = (typeof tables.channels)['$inferInsert']

export type Item = (typeof tables.items)['$inferSelect']

export type NewItem = (typeof tables.items)['$inferInsert']

export type Source = (typeof tables.sources)['$inferSelect']

export type NewSource = (typeof tables.sources)['$inferInsert']

export type Unread = (typeof tables.unreads)['$inferSelect']

export type NewUnread = (typeof tables.unreads)['$inferInsert']
