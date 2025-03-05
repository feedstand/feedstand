import { eq } from 'drizzle-orm'
import { fetchFeed } from '../actions/fetchFeed'
import { insertItems } from '../actions/insertItems'
import { tables } from '../database/tables'
import { convertErrorToString } from '../helpers/errors'
import { db } from '../instances/database'
import { Channel } from '../types/schemas'

export const scanChannel = async (channel: Channel) => {
  try {
    const feedData = await fetchFeed({ url: channel.feedUrl, channel })

    await db
      .update(tables.channels)
      .set({
        title: feedData.channel.title ?? channel.title,
        description: feedData.channel.description ?? channel.description,
        siteUrl: feedData.channel.siteUrl ?? channel.siteUrl,
        feedType: feedData.meta.type || channel.feedType,
        lastScannedAt: new Date(),
        lastScanStatus: 'scanned',
        lastScanEtag: feedData.meta.etag,
        lastScanHash: feedData.meta.hash,
        lastScanError: null,
      })
      .where(eq(tables.channels.id, channel.id))

    insertItems(channel, feedData.items)
  } catch (error) {
    const isNotModified = error instanceof Error && error.cause === 304
    const lastScannedAt = new Date()
    const lastScanStatus = isNotModified ? 'skipped' : 'failed'
    // TODO: Extend the error capturing to store last captured error, response status
    // and number of erroreous scans since last successful scan. This way, we can later
    // downgrade or try to cure the channel which does not work for some period of time.
    const lastScanError = isNotModified
      ? null
      : convertErrorToString(error, { showNestedErrors: true })

    await db
      .update(tables.channels)
      .set({
        lastScannedAt,
        lastScanStatus,
        lastScanError,
      })
      .where(eq(tables.channels.id, channel.id))
  }
}
