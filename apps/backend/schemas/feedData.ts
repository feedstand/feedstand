import { z } from 'zod'
import { feedChannel } from './feedChannel'
import { feedItem } from './feedItem'

export const feedData = z.object({
    channel: feedChannel,
    items: z.array(feedItem),
})
