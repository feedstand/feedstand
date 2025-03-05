import { z } from 'zod'
import { feedItem } from './feedItem'

export const rawFeedItem = feedItem
  .omit({
    itemHash: true,
    contentHash: true,
    rawPublishedAt: true,
  })
  .extend({
    publishedAt: z.string(),
  })
  .partial()
