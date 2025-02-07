import { and, eq, notInArray } from 'drizzle-orm'
import { fetchUrl } from '../actions/fetchUrl'
import { findFeeds } from '../actions/findFeeds'
import { tables } from '../database/tables'
import { convertErrorToString } from '../helpers/errors'
import { db } from '../instances/database'
import { Channel } from '../types/schemas'

export const fixChannel = async (channel: Channel) => {
    try {
        const response = await fetchUrl(channel.url)
        const allFeeds = await findFeeds({ response, channel })
        const validFeeds = allFeeds.filter((feed) => feed.url && feed.url !== channel.url)
        const validFeedUrls = validFeeds.map(({ url }) => url)

        await db
            .update(tables.channels)
            .set({
                lastFixCheckedAt: new Date(),
                lastFixCheckCount: validFeeds.length,
                lastFixCheckError: null,
            })
            .where(eq(tables.channels.id, channel.id))

        if (!validFeeds.length) {
            return
        }

        // First, delete any fixables that are no longer valid.
        await db
            .delete(tables.fixables)
            .where(
                and(
                    eq(tables.fixables.channelId, channel.id),
                    notInArray(tables.fixables.feedUrl, validFeedUrls),
                ),
            )

        // Then, insert all found fixables. If one already exists, ignore insert.
        await db
            .insert(tables.fixables)
            .values(
                validFeeds.map((feed) => ({
                    channelId: channel.id,
                    title: feed.title,
                    feedUrl: feed.url,
                })),
            )
            .onConflictDoNothing()
    } catch (error) {
        await db
            .update(tables.channels)
            .set({
                lastFixCheckedAt: new Date(),
                lastFixCheckCount: null,
                // TODO: Extend the error capturing to store last captured error, response status
                // and number of erroreous scans since last successful scan.
                lastFixCheckError: convertErrorToString(error, { showNestedErrors: true }),
            })
            .where(eq(tables.channels.id, channel.id))
    }
}
