import { createOrUpdateItems } from '../actions/createOrUpdateItems'
import { fetchExternalUrl } from '../actions/fetchExternalUrl'
import { parseFeed } from '../actions/parseFeed'
import { updateChannel } from '../actions/updateChannel'
import { Channel } from '../types/schemas'

export const scanChannel = async (channel: Channel) => {
    const response = await fetchExternalUrl(channel.url)
    const feed = await parseFeed(response, channel.url)

    createOrUpdateItems(channel, feed.items)
    updateChannel(channel, feed.channel)
}
