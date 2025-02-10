import { z } from 'zod'
import { channelType } from './channelType'
import { feedChannel } from './feedChannel'
import { feedItem } from './feedItem'

export const feedData = z.object({
    etag: z.string().nullable(),
    type: channelType,
    channel: feedChannel,
    items: z.array(feedItem),
})
