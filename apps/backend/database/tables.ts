import {
    boolean,
    index,
    integer,
    pgEnum,
    pgTable,
    serial,
    timestamp,
    uniqueIndex,
} from 'drizzle-orm/pg-core'
import { safeText } from './types/safeText'
import { safeVarchar } from './types/safeVarchar'

export const users = pgTable(
    'users',
    {
        id: serial('id').primaryKey(),
        name: safeVarchar('name').notNull(),
        email: safeVarchar('email').notNull(),
        password: safeVarchar('password').notNull(),
        emailVerifiedAt: timestamp('email_verified_at'),
        createdAt: timestamp('created_at').notNull().defaultNow(),
        updatedAt: timestamp('updated_at').notNull().defaultNow(),
    },
    (table) => [uniqueIndex('users_email_idx').on(table.email)],
)

export const channelType = pgEnum('channel_types', ['xml', 'json'])
export const channelJobStatus = pgEnum('channel_job_statuses', ['success', 'pass', 'error'])

export const channels = pgTable(
    'channels',
    {
        id: serial('id').primaryKey(),
        title: safeVarchar('title'),
        description: safeVarchar('description'),
        siteUrl: safeText('site_url'),
        feedUrl: safeText('feed_url').notNull(),
        feedType: channelType('feed_type'),
        createdAt: timestamp('created_at').notNull().defaultNow(),
        updatedAt: timestamp('updated_at').notNull().defaultNow(),
        lastScannedAt: timestamp('last_scanned_at'),
        lastScanStatus: channelJobStatus('last_scan_status'),
        lastScanEtag: safeVarchar('last_scan_etag'),
        lastScanError: safeText('last_scan_error'),
        lastFixCheckedAt: timestamp('last_fix_checked_at'),
        lastFixCheckStatus: channelJobStatus('last_fix_check_status'),
        lastFixCheckEtag: safeVarchar('last_fix_check_etag'),
        lastFixCheckError: safeText('last_fix_check_error'),
    },
    (table) => [uniqueIndex('channels_feed_url_idx').on(table.feedUrl)],
)

export const fixables = pgTable(
    'fixables',
    {
        id: serial('id').primaryKey(),
        channelId: integer('channel_id')
            .notNull()
            .references(() => channels.id, { onDelete: 'cascade' }),
        title: safeVarchar('title'),
        feedUrl: safeText('feed_url').notNull(),
    },
    (table) => [uniqueIndex('fixables_channel_id_feed_url_idx').on(table.channelId, table.feedUrl)],
)

export const items = pgTable(
    'items',
    {
        id: serial('id').primaryKey(),
        link: safeVarchar('link').notNull(),
        guid: safeVarchar('guid').notNull(),
        channelId: integer('channel_id')
            .notNull()
            .references(() => channels.id, { onDelete: 'cascade' }),
        title: safeVarchar('title'),
        description: safeVarchar('description'),
        author: safeVarchar('author'),
        content: safeText('content'),
        isReadabilitified: boolean('is_readabilitified').default(false),
        error: safeText('error'),
        publishedAt: timestamp('published_at').notNull(),
        createdAt: timestamp('created_at').notNull().defaultNow(),
        updatedAt: timestamp('updated_at').notNull().defaultNow(),
    },
    (table) => [
        index('items_guid_idx').on(table.guid),
        uniqueIndex('items_channel_id_guid').on(table.channelId, table.guid),
        index('items_published_at_idx').on(table.publishedAt),
    ],
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
        name: safeVarchar('name').notNull(),
        isReadabilitified: boolean('is_readabilitified').default(false),
        createdAt: timestamp('created_at').notNull().defaultNow(),
        updatedAt: timestamp('updated_at').notNull().defaultNow(),
    },
    (table) => [uniqueIndex('sources_user_channel_idx').on(table.userId, table.channelId)],
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
    (table) => [uniqueIndex('unreads_user_item_idx').on(table.userId, table.itemId)],
)

export const tables = {
    users,
    channels,
    fixables,
    items,
    sources,
    unreads,
}

export const enums = {
    channelType,
    channelJobStatus,
}
