import { channels } from '~/database/tables.js'
import { db } from '~/instances/database.js'
import { fetchAndParseFeed } from './fetchAndParseFeed.js'
import { Channel } from '~/types/database.js'
import { scanExistingChannel } from './scanExistingChannel.js'

export const fetchOrCreateChannel = async (url: string): Promise<Channel> => {
    const existingChannel = await db.query.channels.findFirst({
        where: (channels, { eq }) => eq(channels.url, url),
    })

    if (existingChannel) {
        // TODO: Do we need this? Maybe it depends on the last update time and the frequency of
        // updating this particular channel?
        // await scanExistingChannel(existingChannel)

        return existingChannel
    }

    const feed = await fetchAndParseFeed(url)
    const [newChannel] = await db.insert(channels).values(feed.channel).returning()

    // TODO: Do we scan for new items right away? Or perform scanning for new items when the user
    // opens the page with the channel and it's empty?
    await scanExistingChannel(newChannel)

    return newChannel
}
