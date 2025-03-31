import type { z } from 'zod'
import type { alias } from '../schemas/alias'
import type { channel } from '../schemas/channel'
import type { channelFixCheckStatus } from '../schemas/channelFixCheckStatus'
import type { channelScanStatus } from '../schemas/channelScanStatus'
import type { channelType } from '../schemas/channelType'
import type { feedChannel } from '../schemas/feedChannel'
import type { feedData } from '../schemas/feedData'
import type { feedItem } from '../schemas/feedItem'
import type { fixable } from '../schemas/fixable'
import type { fixableType } from '../schemas/fixableType'
import type { foundFeeds } from '../schemas/foundFeeds'
import type { item } from '../schemas/item'
import type { newAlias } from '../schemas/newAlias'
import type { newChannel } from '../schemas/newChannel'
import type { newFixable } from '../schemas/newFixable'
import type { newItem } from '../schemas/newItem'
import type { newSource } from '../schemas/newSource'
import type { newUnread } from '../schemas/newUnread'
import type { newUser } from '../schemas/newUser'
import type { rawFeedChannel } from '../schemas/rawFeedChannel'
import type { rawFeedItem } from '../schemas/rawFeedItem'
import type { source } from '../schemas/source'
import type { unread } from '../schemas/unread'
import type { user } from '../schemas/user'

export type User = z.infer<typeof user>

export type NewUser = z.infer<typeof newUser>

export type ChannelType = z.infer<typeof channelType>

export type ChannelScanStatus = z.infer<typeof channelScanStatus>

export type ChannelFixCheckStatus = z.infer<typeof channelFixCheckStatus>

export type Channel = z.infer<typeof channel>

export type NewChannel = z.infer<typeof newChannel>

export type Alias = z.infer<typeof alias>

export type NewAlias = z.infer<typeof newAlias>

export type FixableType = z.infer<typeof fixableType>

export type Fixable = z.infer<typeof fixable>

export type NewFixable = z.infer<typeof newFixable>

export type Item = z.infer<typeof item>

export type NewItem = z.infer<typeof newItem>

export type Source = z.infer<typeof source>

export type NewSource = z.infer<typeof newSource>

export type Unread = z.infer<typeof unread>

export type NewUnread = z.infer<typeof newUnread>

export type FoundFeeds = z.infer<typeof foundFeeds>

export type FeedData = z.infer<typeof feedData>

export type FeedChannel = z.infer<typeof feedChannel>

export type RawFeedChannel = z.infer<typeof rawFeedChannel>

export type FeedItem = z.infer<typeof feedItem>

export type RawFeedItem = z.infer<typeof rawFeedItem>
