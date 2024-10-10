import { Channel } from '../types/schemas'
import { createOrUpdateItems } from './createOrUpdateItems'
import { fetchExternalUrl } from './fetchExternalUrl'
import { parseFeed } from './parseFeed'
import { updateChannel } from './updateChannel'

export const scanExistingChannel = async (channel: Channel) => {
    const response = await fetchExternalUrl(channel.url)
    const feed = await parseFeed(response)

    createOrUpdateItems(channel, feed.items)
    updateChannel(channel, feed.channel)
}
