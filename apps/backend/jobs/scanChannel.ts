import { eq } from 'drizzle-orm'
import { createOrUpdateItems } from '../actions/createOrUpdateItems'
import { fetchFeed } from '../actions/fetchFeed'
import { tables } from '../database/tables'
import { convertErrorToString } from '../helpers/errors'
import { db } from '../instances/database'
import { Channel } from '../types/schemas'

export const scanChannel = async (channel: Channel) => {
    try {
        const feed = await fetchFeed(channel.url, { channel })

        await db
            .update(tables.channels)
            .set({
                title: feed.channel.title ?? channel.title,
                description: feed.channel.description ?? channel.description,
                link: feed.channel.link ?? channel.link,
                error: null,
                lastScannedAt: new Date(),
            })
            .where(eq(tables.channels.id, channel.id))

        createOrUpdateItems(channel, feed.items)
    } catch (error) {
        // TODO: Store more error details for further debug proces. Things to consider storing:
        // Whole Response object, body, status code, number of errors since last successful scan.
        await db
            .update(tables.channels)
            .set({ error: convertErrorToString(error, { showNestedErrors: true }) })
            .where(eq(tables.channels.id, channel.id))
    }
}
