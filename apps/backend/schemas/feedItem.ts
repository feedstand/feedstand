import { newItem } from './newItem'

export const feedItem = newItem.pick({
    link: true,
    guid: true,
    title: true,
    description: true,
    author: true,
    content: true,
    publishedAt: true,
    rawPublishedAt: true,
})
