import { newItem } from './newItem'

export const feedItem = newItem.pick({
    title: true,
    link: true,
    description: true,
    author: true,
    guid: true,
    content: true,
    publishedAt: true,
})
