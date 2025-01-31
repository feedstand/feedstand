import { eq } from 'drizzle-orm'
import { createOrUpdateItems } from '../actions/createOrUpdateItems'
import { fetchFeed } from '../actions/fetchFeed'
import { parseFeed } from '../actions/parseFeed'
import { updateChannel } from '../actions/updateChannel'
import { isWorker } from '../constants/queue'
import { tables } from '../database/tables'
import { convertErrorToString } from '../helpers/errors'
import { db } from '../instances/database'
import { Channel } from '../types/schemas'

export const scanChannel = async (channel: Channel) => {
    try {
        const response = await fetchFeed(channel.url, { channel })
        const feed = await parseFeed(response, { channel })

        if (!isWorker) {
            console.error({ channel })
        }

        createOrUpdateItems(channel, feed.items)
        updateChannel(channel, feed.channel)
    } catch (error) {
        if (!isWorker) {
            console.error({ channel, error })
        }

        // TODO: Store more error details for further debug proces. Things to consider storing:
        // Whole Response object, body, status code, number of errors since last successful scan.
        await db
            .update(tables.channels)
            .set({ error: convertErrorToString(error, { showNestedErrors: true }) })
            .where(eq(tables.channels.id, channel.id))
    }
}
