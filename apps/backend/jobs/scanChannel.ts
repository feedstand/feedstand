import { eq } from 'drizzle-orm'
import { fetchFeed } from '../actions/fetchFeed.ts'
import { insertItems } from '../actions/insertItems.ts'
import { tables } from '../database/tables.ts'
import { NotModifiedError } from '../errors/NotModifiedError.ts'
import { convertErrorToString } from '../helpers/errors.ts'
import { db } from '../instances/database.ts'
import type { Channel } from '../types/schemas.ts'

export const scanChannel = async (channel: Channel) => {
  try {
    const feedData = await fetchFeed({ url: channel.feedUrl, channel })

    await db
      .update(tables.channels)
      .set({
        title: feedData.channel.title ?? channel.title,
        description: feedData.channel.description ?? channel.description,
        siteUrl: feedData.channel.siteUrl ?? channel.siteUrl,
        feedFormat: feedData.meta.format || channel.feedFormat,
        lastScanAt: new Date(),
        lastScanStatus: 'scanned',
        lastScanEtag: feedData.meta.etag,
        lastScanLastModified: feedData.meta.lastModified,
        lastScanContentBytes: feedData.meta.contentBytes,
        lastScanHash: feedData.meta.hash,
        lastScanError: null,
      })
      .where(eq(tables.channels.id, channel.id))

    await insertItems(channel, feedData.items)
  } catch (error) {
    if (error instanceof NotModifiedError) {
      const headers = error.response.headers

      await db
        .update(tables.channels)
        .set({
          lastScanAt: new Date(),
          lastScanStatus: 'skipped',
          lastScanError: null,
          lastScanEtag: headers.get('etag') ?? channel.lastScanEtag,
          lastScanLastModified: headers.get('last-modified') ?? channel.lastScanLastModified,
        })
        .where(eq(tables.channels.id, channel.id))

      return
    }

    // TODO: Extend the error capturing to store last captured error, response status
    // and number of erroreous scans since last successful scan. This way, we can later
    // downgrade or try to cure the channel which does not work for some period of time.
    await db
      .update(tables.channels)
      .set({
        lastScanAt: new Date(),
        lastScanStatus: 'failed',
        lastScanError: convertErrorToString(error, { showNestedErrors: true }),
      })
      .where(eq(tables.channels.id, channel.id))
  }
}
