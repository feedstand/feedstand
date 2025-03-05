import { z } from 'zod'
import { channelType } from './channelType'
import { feedChannel } from './feedChannel'
import { feedItem } from './feedItem'

export const feedData = z.object({
  meta: z.object({
    etag: z.string().nullable(),
    hash: z.string().optional(),
    type: channelType,
    requestUrl: z.string(),
    responseUrl: z.string(),
  }),
  channel: feedChannel,
  items: z.array(feedItem),
})
