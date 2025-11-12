import { and, eq, notInArray } from 'drizzle-orm'
import { findFeeds } from '../actions/findFeeds.ts'
import { tables } from '../database/tables.ts'
import { NotModifiedError } from '../errors/NotModifiedError.ts'
import { convertErrorToString } from '../helpers/errors.ts'
import { db } from '../instances/database.ts'
import type { Channel } from '../types/schemas.ts'

export const fixChannel = async (channel: Channel) => {
  const url = channel.siteUrl || channel.feedUrl

  try {
    const { meta, feeds } = await findFeeds({ url, channel })
    const feedUrls = feeds.map(({ url }) => url)

    await db
      .update(tables.channels)
      .set({
        lastFixCheckAt: new Date(),
        lastFixCheckStatus: 'checked',
        lastFixCheckEtag: meta.etag,
        lastFixCheckLastModified: meta.lastModified,
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
    if (error instanceof NotModifiedError) {
      const headers = error.response.headers

      await db
        .update(tables.channels)
        .set({
          lastFixCheckAt: new Date(),
          lastFixCheckStatus: 'skipped',
          lastFixCheckError: null,
          lastFixCheckEtag: headers.get('etag') ?? channel.lastFixCheckEtag,
          lastFixCheckLastModified:
            headers.get('last-modified') ?? channel.lastFixCheckLastModified,
        })
        .where(eq(tables.channels.id, channel.id))

      return
    }

    // Handle other errors
    await db
      .update(tables.channels)
      .set({
        lastFixCheckAt: new Date(),
        lastFixCheckStatus: 'failed',
        lastFixCheckError: convertErrorToString(error, { showNestedErrors: true }),
      })
      .where(eq(tables.channels.id, channel.id))
  }
}
