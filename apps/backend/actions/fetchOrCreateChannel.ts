import { eq } from 'drizzle-orm'
import { tables } from '../database/tables'
import { db } from '../instances/database'
import { Channel } from '../types/schemas'
import { fetchExternalUrl } from './fetchExternalUrl'
import { parseFeed } from './parseFeed'
import { scanExistingChannel } from './scanExistingChannel'

export const fetchOrCreateChannel = async (url: string): Promise<Channel> => {
    const [existingChannel] = await db
        .select()
        .from(tables.channels)
        .where(eq(tables.channels.url, url))
        .limit(1)

    if (existingChannel) {
        // TODO: Do we need this? Maybe it depends on the last update time and the frequency of
        // updating this particular channel?
        // await scanExistingChannel(existingChannel)

        return existingChannel
    }

    const response = await fetchExternalUrl(url)
    const feed = await parseFeed(response)
    const [newChannel] = await db.insert(tables.channels).values(feed.channel).returning()

    // TODO: Do we scan for new items right away? Or perform scanning for new items when the user
    // opens the page with the channel and it's empty?
    await scanExistingChannel(newChannel)

    return newChannel
}
