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
                lastScannedAt: new Date(),
                lastScanError: null,
            })
            .where(eq(tables.channels.id, channel.id))

        createOrUpdateItems(channel, feed.items)
    } catch (error) {
        await db
            .update(tables.channels)
            .set({
                lastScannedAt: new Date(),
                // TODO: Extend the error capturing to store last captured error, response status
                // and number of erroreous scans since last successful scan. This way, we can later
                // downgrade or try to cure the channel which does not work for some period of time.
                lastScanError: convertErrorToString(error, { showNestedErrors: true }),
            })
            .where(eq(tables.channels.id, channel.id))
    }
}
