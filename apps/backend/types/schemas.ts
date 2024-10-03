import { z } from 'zod'
import { channel } from '../schemas/channel'
import { feed } from '../schemas/feed'
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

export type Channel = z.infer<typeof channel>

export type NewChannel = z.infer<typeof newChannel>

export type Item = z.infer<typeof item>

export type NewItem = z.infer<typeof newItem>

export type Source = z.infer<typeof source>

export type NewSource = z.infer<typeof newSource>

export type Unread = z.infer<typeof unread>

export type NewUnread = z.infer<typeof newUnread>

export type Feed = z.infer<typeof feed>
