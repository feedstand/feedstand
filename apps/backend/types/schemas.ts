import type { z } from 'zod'
import type { alias } from '../schemas/alias.ts'
import type { channel } from '../schemas/channel.ts'
import type { channelFixCheckStatus } from '../schemas/channelFixCheckStatus.ts'
import type { channelFormat } from '../schemas/channelFormat.ts'
import type { channelScanStatus } from '../schemas/channelScanStatus.ts'
import type { feedChannel } from '../schemas/feedChannel.ts'
import type { feedData } from '../schemas/feedData.ts'
import type { feedItem } from '../schemas/feedItem.ts'
import type { fixable } from '../schemas/fixable.ts'
import type { fixableType } from '../schemas/fixableType.ts'
import type { foundFeeds } from '../schemas/foundFeeds.ts'
import type { item } from '../schemas/item.ts'
import type { newAlias } from '../schemas/newAlias.ts'
import type { newChannel } from '../schemas/newChannel.ts'
import type { newFixable } from '../schemas/newFixable.ts'
import type { newItem } from '../schemas/newItem.ts'
import type { newSource } from '../schemas/newSource.ts'
import type { newUnread } from '../schemas/newUnread.ts'
import type { newUser } from '../schemas/newUser.ts'
import type { rawFeedChannel } from '../schemas/rawFeedChannel.ts'
import type { rawFeedItem } from '../schemas/rawFeedItem.ts'
import type { source } from '../schemas/source.ts'
import type { unread } from '../schemas/unread.ts'
import type { user } from '../schemas/user.ts'

export type User = z.infer<typeof user>
export type NewUser = z.infer<typeof newUser>
export type ChannelFormat = z.infer<typeof channelFormat>
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
