import { Channel } from '../types/schemas'
import { createOrUpdateItems } from './createOrUpdateItems'
import { fetchPageOrFeed } from './fetchPageOrFeed'
import { parseFeed } from './parseFeed'
import { updateChannel } from './updateChannel'

export const scanExistingChannel = async (channel: Channel) => {
    const pageOrFeed = await fetchPageOrFeed(channel.url)
    const feed = await parseFeed(pageOrFeed)

    createOrUpdateItems(channel, feed.items)
    updateChannel(channel, feed.channel)
}
