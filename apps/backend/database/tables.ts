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
  (table) => [uniqueIndex('users_email').on(table.email)],
)

export const channelType = pgEnum('channel_types', ['atom', 'json', 'rdf', 'rss'])
export const channelScanStatus = pgEnum('channel_scan_statuses', ['scanned', 'skipped', 'failed'])
export const channelFixCheckStatus = pgEnum('channel_fix_check_statuses', [
  'checked',
  'skipped',
  'failed',
])

export const channels = pgTable(
  'channels',
  {
    id: serial('id').primaryKey(),
    title: safeVarchar('title'),
    description: safeVarchar('description'),
    siteUrl: safeText('site_url'),
    selfUrl: safeText('self_url'),
    feedUrl: safeText('feed_url').notNull(),
    feedType: channelType('feed_type'),
    createdAt: timestamp('created_at').notNull().defaultNow(),
    updatedAt: timestamp('updated_at').notNull().defaultNow(),
    lastScannedAt: timestamp('last_scanned_at'),
    lastScanStatus: channelScanStatus('last_scan_status'),
    lastScanEtag: safeVarchar('last_scan_etag'),
    lastScanHash: safeVarchar('last_scan_hash'),
    lastScanError: safeText('last_scan_error'),
    lastFixCheckedAt: timestamp('last_fix_checked_at'),
    lastFixCheckStatus: channelFixCheckStatus('last_fix_check_status'),
    lastFixCheckEtag: safeVarchar('last_fix_check_etag'),
    lastFixCheckHash: safeVarchar('last_fix_check_hash'),
    lastFixCheckError: safeText('last_fix_check_error'),
  },
  (table) => [uniqueIndex('channels_feed_url').on(table.feedUrl)],
)

export const aliases = pgTable(
  'aliases',
  {
    id: serial('id').primaryKey(),
    aliasUrl: safeText('alias_url').notNull(),
    channelId: integer('channel_id')
      .references(() => channels.id, { onDelete: 'cascade' })
      .notNull(),
    createdAt: timestamp('created_at').notNull().defaultNow(),
    updatedAt: timestamp('updated_at').notNull().defaultNow(),
  },
  (table) => [uniqueIndex('channel_aliases_alias_url').on(table.aliasUrl)],
)

export const fixableType = pgEnum('fixable_types', ['defunct', 'redirect'])

export const fixables = pgTable(
  'fixables',
  {
    id: serial('id').primaryKey(),
    type: fixableType('type').notNull(),
    fromUrl: safeText('from_url').notNull(),
    feedUrl: safeText('feed_url').notNull(),
    title: safeVarchar('title'),
    channelId: integer('channel_id').references(() => channels.id, { onDelete: 'set null' }),
  },
  (table) => [
    index('fixables_type').on(table.type),
    uniqueIndex('fixables_from_url').on(table.feedUrl),
    index('fixables_feed_url').on(table.feedUrl),
  ],
)

export const items = pgTable(
  'items',
  {
    id: serial('id').primaryKey(),
    link: safeVarchar('link').notNull(),
    guid: safeVarchar('guid').notNull(),
    title: safeVarchar('title'),
    description: safeVarchar('description'),
    author: safeVarchar('author'),
    content: safeText('content'),
    channelId: integer('channel_id')
      .notNull()
      .references(() => channels.id, { onDelete: 'cascade' }),
    itemHash: safeVarchar('item_hash'),
    contentHash: safeVarchar('content_hash'),
    publishedAt: timestamp('published_at').notNull(),
    createdAt: timestamp('created_at').notNull().defaultNow(),
    updatedAt: timestamp('updated_at').notNull().defaultNow(),
    rawPublishedAt: safeVarchar('raw_published_at'),
  },
  (table) => [
    index('items_item_checksum').on(table.itemHash),
    uniqueIndex('items_channel_id_item_checksum_content_checksum').on(
      table.channelId,
      table.itemHash,
      table.contentHash,
    ),
    index('items_published_at').on(table.publishedAt),
  ],
)

export const sources = pgTable(
  'sources',
  {
    id: serial('id').primaryKey(),
    userId: integer('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    aliasId: integer('alias_id')
      .notNull()
      .references(() => aliases.id, { onDelete: 'cascade' }),
    name: safeVarchar('name').notNull(),
    // TODO: Also add ability to mark specific items as isReadibilitified. This should be done
    // between the user and the item, so probably in another table linking those two.
    isReadabilitified: boolean('is_readabilitified').default(false),
    createdAt: timestamp('created_at').notNull().defaultNow(),
    updatedAt: timestamp('updated_at').notNull().defaultNow(),
  },
  (table) => [uniqueIndex('sources_user_alias').on(table.userId, table.aliasId)],
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
  (table) => [uniqueIndex('unreads_user_item').on(table.userId, table.itemId)],
)

export const tables = {
  users,
  channels,
  aliases,
  fixables,
  items,
  sources,
  unreads,
}

export const enums = {
  channelType,
  channelScanStatus,
  channelFixCheckStatus,
  fixableType,
}
