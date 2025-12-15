import { z } from 'zod'
import { channelFormat } from './channelFormat.ts'
import { feedChannel } from './feedChannel.ts'
import { feedItem } from './feedItem.ts'

export const feedData = z.object({
  meta: z.object({
    etag: z.string().nullable(),
    lastModified: z.string().nullable(),
    contentBytes: z.number(),
    hash: z.string().optional(),
    format: channelFormat,
    requestUrl: z.string(),
    responseUrl: z.string(),
  }),
  channel: feedChannel,
  items: z.array(feedItem),
})
