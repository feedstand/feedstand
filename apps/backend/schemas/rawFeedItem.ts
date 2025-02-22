import { z } from 'zod'
import { feedItem } from './feedItem'

export const rawFeedItem = feedItem
  .omit({
    itemChecksum: true,
    contentChecksum: true,
    rawPublishedAt: true,
  })
  .extend({
    publishedAt: z.string(),
  })
  .partial()
