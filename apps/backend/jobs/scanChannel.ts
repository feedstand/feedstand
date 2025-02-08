import { eq } from 'drizzle-orm'
import { createOrUpdateItems } from '../actions/createOrUpdateItems'
import { fetchFeed } from '../actions/fetchFeed'
import { tables } from '../database/tables'
import { convertErrorToString } from '../helpers/errors'
import { db } from '../instances/database'
import { Channel } from '../types/schemas'

export const scanChannel = async (channel: Channel) => {
    try {
        const feedData = await fetchFeed({ url: channel.url, channel })

        await db
            .update(tables.channels)
            .set({
                title: feedData.channel.title ?? channel.title,
                description: feedData.channel.description ?? channel.description,
                link: feedData.channel.link ?? channel.link,
                lastScannedAt: new Date(),
                lastScanEtag: feedData.etag,
                lastScanError: null,
            })
            .where(eq(tables.channels.id, channel.id))

        createOrUpdateItems(channel, feedData.items)
    } catch (error) {
        // TODO: Consider storing info about the 304 Not Modified status differently.
        // At this moment it's stored as an error but this is not semantically correct.

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
