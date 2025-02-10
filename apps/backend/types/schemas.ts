import { z } from 'zod'
import { channel } from '../schemas/channel'
import { channelFixCheckStatus } from '../schemas/channelFixCheckStatus'
import { channelScanStatus } from '../schemas/channelScanStatus'
import { channelType } from '../schemas/channelType'
import { feedChannel } from '../schemas/feedChannel'
import { feedData } from '../schemas/feedData'
import { feedInfo } from '../schemas/feedInfo'
import { feedItem } from '../schemas/feedItem'
import { item } from '../schemas/item'
import { newChannel } from '../schemas/newChannel'
import { newItem } from '../schemas/newItem'
import { newSource } from '../schemas/newSource'
import { newUnread } from '../schemas/newUnread'
import { newUser } from '../schemas/newUser'
import { source } from '../schemas/source'
import { unread } from '../schemas/unread'
import { user } from '../schemas/user'

export type User = z.infer<typeof user>

export type NewUser = z.infer<typeof newUser>

export type ChannelType = z.infer<typeof channelType>

export type ChannelScanStatus = z.infer<typeof channelScanStatus>

export type ChannelFixCheckStatus = z.infer<typeof channelFixCheckStatus>

export type Channel = z.infer<typeof channel>

export type NewChannel = z.infer<typeof newChannel>

export type Item = z.infer<typeof item>

export type NewItem = z.infer<typeof newItem>

export type Source = z.infer<typeof source>

export type NewSource = z.infer<typeof newSource>

export type Unread = z.infer<typeof unread>

export type NewUnread = z.infer<typeof newUnread>

export type FeedInfo = z.infer<typeof feedInfo>

export type FeedData = z.infer<typeof feedData>

export type FeedChannel = z.infer<typeof feedChannel>

export type FeedItem = z.infer<typeof feedItem>
