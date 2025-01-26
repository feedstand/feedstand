import { eq } from 'drizzle-orm'
import { createOrUpdateItems } from '../actions/createOrUpdateItems'
import { fetchExternalUrl } from '../actions/fetchExternalUrl'
import { parseFeed } from '../actions/parseFeed'
import { updateChannel } from '../actions/updateChannel'
import { tables } from '../database/tables'
import { convertErrorToString } from '../helpers/errors'
import { db } from '../instances/database'
import { Channel } from '../types/schemas'

export const scanChannel = async (channel: Channel) => {
    try {
        const response = await fetchExternalUrl(channel.url)
        const feed = await parseFeed(response, channel.url)

        createOrUpdateItems(channel, feed.items)
        updateChannel(channel, feed.channel)
    } catch (error) {
        // TODO: Store more error details for further debug proces. Things to consider storing:
        // Whole Response object, body, status code, number of errors since last successful scan.
        await db
            .update(tables.channels)
            .set({ error: convertErrorToString(error, { showNestedErrors: true }) })
            .where(eq(tables.channels.id, channel.id))
    }
}
