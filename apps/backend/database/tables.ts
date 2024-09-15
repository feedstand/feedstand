import {
    pgTable,
    bigserial,
    varchar,
    timestamp,
    uniqueIndex,
    text,
    bigint,
    index,
    foreignKey,
} from 'drizzle-orm/pg-core'

export const users = pgTable(
    'users',
    {
        id: bigserial('id', { mode: 'bigint' }).primaryKey(),
        name: varchar('name').notNull(),
        email: varchar('email').notNull(),
        password: varchar('password').notNull(),
        emailVerifiedAt: timestamp('email_verified_at'),
        createdAt: timestamp('created_at').notNull().defaultNow(),
        updatedAt: timestamp('updated_at').notNull().defaultNow(),
    },
    (table) => ({
        emailIdx: uniqueIndex('users_email_idx').on(table.email),
    }),
)

export const channels = pgTable(
    'channels',
    {
        id: bigserial('id', { mode: 'bigint' }).primaryKey(),
        url: text('url').notNull(),
        title: varchar('title').notNull(),
        link: text('link').notNull(),
        description: varchar('description'),
        createdAt: timestamp('created_at').notNull().defaultNow(),
        updatedAt: timestamp('updated_at').notNull().defaultNow(),
        lastScannedAt: timestamp('last_scanned_at'),
    },
    (table) => ({
        urlIdx: uniqueIndex('channels_url_idx').on(table.url),
    }),
)

export const items = pgTable(
    'items',
    {
        id: bigserial('id', { mode: 'bigint' }).primaryKey(),
        channelId: bigint('channel_id', { mode: 'bigint' })
            .notNull()
            .references(() => channels.id, { onDelete: 'cascade' }),
        title: varchar('title').notNull(),
        link: varchar('link').notNull(),
        description: varchar('description'),
        author: varchar('author'),
        guid: varchar('guid').notNull(),
        content: text('content').notNull(),
        publishedAt: timestamp('published_at').notNull(),
        createdAt: timestamp('created_at').notNull().defaultNow(),
        updatedAt: timestamp('updated_at').notNull().defaultNow(),
    },
    (table) => ({
        guidIdx: index('items_guid_idx').on(table.guid),
        channelIdFk: foreignKey({
            columns: [table.channelId],
            foreignColumns: [channels.id],
        }).onDelete('cascade'),
    }),
)

export const sources = pgTable(
    'sources',
    {
        id: bigserial('id', { mode: 'bigint' }).primaryKey(),
        userId: bigint('user_id', { mode: 'bigint' })
            .notNull()
            .references(() => users.id, { onDelete: 'cascade' }),
        channelId: bigint('channel_id', { mode: 'bigint' })
            .notNull()
            .references(() => channels.id, { onDelete: 'cascade' }),
        name: varchar('name').notNull(),
        createdAt: timestamp('created_at').notNull().defaultNow(),
        updatedAt: timestamp('updated_at').notNull().defaultNow(),
    },
    (table) => ({
        userChannelIdx: uniqueIndex('sources_user_channel_idx').on(table.userId, table.channelId),
        userIdFk: foreignKey({
            columns: [table.userId],
            foreignColumns: [users.id],
        }).onDelete('cascade'),
        channelIdFk: foreignKey({
            columns: [table.channelId],
            foreignColumns: [channels.id],
        }).onDelete('cascade'),
    }),
)

export const unreads = pgTable(
    'unreads',
    {
        id: bigserial('id', { mode: 'bigint' }).primaryKey(),
        userId: bigint('user_id', { mode: 'bigint' })
            .notNull()
            .references(() => users.id, { onDelete: 'cascade' }),
        itemId: bigint('item_id', { mode: 'bigint' })
            .notNull()
            .references(() => items.id, { onDelete: 'cascade' }),
    },
    (table) => ({
        userItemIdx: uniqueIndex('unreads_user_item_idx').on(table.userId, table.itemId),
        userIdFk: foreignKey({
            columns: [table.userId],
            foreignColumns: [users.id],
        }).onDelete('cascade'),
        itemIdFk: foreignKey({
            columns: [table.itemId],
            foreignColumns: [items.id],
        }).onDelete('cascade'),
    }),
)
