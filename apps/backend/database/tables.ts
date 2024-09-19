import {
    pgTable,
    serial,
    varchar,
    timestamp,
    uniqueIndex,
    text,
    index,
    foreignKey,
    integer,
} from 'drizzle-orm/pg-core'

export const users = pgTable(
    'users',
    {
        id: serial('id').primaryKey(),
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
        id: serial('id').primaryKey(),
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
        id: serial('id').primaryKey(),
        channelId: integer('channel_id')
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
        channelIdGuidIdx: uniqueIndex('items_channel_id_guid').on(table.channelId, table.guid),
        publishedAtIdx: index('items_published_at_idx').on(table.publishedAt),
    }),
)

export const sources = pgTable(
    'sources',
    {
        id: serial('id').primaryKey(),
        userId: integer('user_id')
            .notNull()
            .references(() => users.id, { onDelete: 'cascade' }),
        channelId: integer('channel_id')
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
        id: serial('id').primaryKey(),
        userId: integer('user_id')
            .notNull()
            .references(() => users.id, { onDelete: 'cascade' }),
        itemId: integer('item_id')
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
