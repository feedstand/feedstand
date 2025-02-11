import { and, eq, notInArray } from 'drizzle-orm'
import { findFeeds } from '../actions/findFeeds'
import { tables } from '../database/tables'
import { convertErrorToString } from '../helpers/errors'
import { db } from '../instances/database'
import { Channel } from '../types/schemas'

export const fixChannel = async (channel: Channel) => {
    if (!channel.siteUrl) {
        return
    }

    try {
        const { etag, feeds } = await findFeeds({ url: channel.siteUrl, channel })
        const feedUrls = feeds.map(({ url }) => url)

        await db
            .update(tables.channels)
            .set({
                lastFixCheckedAt: new Date(),
                lastFixCheckStatus: 'checked',
                lastFixCheckEtag: etag,
                lastFixCheckError: null,
            })
            .where(eq(tables.channels.id, channel.id))

        // First, delete any fixables that are no longer valid.
        await db
            .delete(tables.fixables)
            .where(
                and(
                    eq(tables.fixables.channelId, channel.id),
                    notInArray(tables.fixables.feedUrl, feedUrls),
                ),
            )

        if (!feeds.length) {
            return
        }

        // Then, insert all found fixables. If one already exists, ignore insert.
        await db
            .insert(tables.fixables)
            .values(
                feeds.map((feed) => ({
                    channelId: channel.id,
                    title: feed.title,
                    feedUrl: feed.url,
                })),
            )
            .onConflictDoNothing()
    } catch (error) {
        const isNotModified = error instanceof Error && error.cause === 304
        const lastFixCheckedAt = new Date()
        const lastFixCheckStatus = isNotModified ? 'skipped' : 'failed'
        const lastFixCheckError = isNotModified
            ? null
            : convertErrorToString(error, { showNestedErrors: true })

        await db
            .update(tables.channels)
            .set({
                lastFixCheckedAt,
                lastFixCheckStatus,
                lastFixCheckError,
            })
            .where(eq(tables.channels.id, channel.id))
    }
}
