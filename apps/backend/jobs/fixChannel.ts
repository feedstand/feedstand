import { and, eq, notInArray } from 'drizzle-orm'
import { findFeeds } from '../actions/findFeeds.js'
import { tables } from '../database/tables.js'
import { convertErrorToString } from '../helpers/errors.js'
import { db } from '../instances/database.js'
import type { Channel } from '../types/schemas.js'

export const fixChannel = async (channel: Channel) => {
  const url = channel.siteUrl || channel.feedUrl

  try {
    const { meta, feeds } = await findFeeds({ url, channel })
    const feedUrls = feeds.map(({ url }) => url)

    await db
      .update(tables.channels)
      .set({
        lastFixCheckedAt: new Date(),
        lastFixCheckStatus: 'checked',
        lastFixCheckEtag: meta.etag,
        lastFixCheckHash: meta.hash,
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
          type: 'defunct' as const,
          fromUrl: channel.feedUrl,
          feedUrl: feed.url,
          channelId: channel.id,
          title: feed.title,
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
