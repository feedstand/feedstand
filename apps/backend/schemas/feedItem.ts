import { newItem } from './newItem'

export const feedItem = newItem.pick({
  link: true,
  guid: true,
  title: true,
  description: true,
  author: true,
  content: true,
  itemHash: true,
  contentHash: true,
  publishedAt: true,
  rawPublishedAt: true,
})
