import { eq } from 'drizzle-orm'
import { fetchFeed } from '../actions/fetchFeed'
import { tables } from '../database/tables'
import { db } from '../instances/database'
import { chooseFeedUrl } from './chooseFeedUrl'
import { insertItems } from './insertItems'

export const upsertChannel = async (requestUrl: string) => {
  return db.transaction(async (tx) => {
    const fetchExistingChannelAndAlias = async (aliasUrl: string) => {
      const [existingChannelAndAlias] = await tx
        .select({
          channel: tables.channels,
          alias: tables.aliases,
        })
        .from(tables.aliases)
        .innerJoin(tables.channels, eq(tables.aliases.channelId, tables.channels.id))
        .where(eq(tables.aliases.aliasUrl, aliasUrl))
        .limit(1)

      return existingChannelAndAlias
    }

    const existingChannelAndAliasByRequestUrl = await fetchExistingChannelAndAlias(requestUrl)

    if (existingChannelAndAliasByRequestUrl) {
      return existingChannelAndAliasByRequestUrl
    }

    const feedData = await fetchFeed({ url: requestUrl })

    const existingChannelAndAliasByResponseUrl = await fetchExistingChannelAndAlias(
      feedData.meta.responseUrl,
    )

    if (existingChannelAndAliasByResponseUrl) {
      return existingChannelAndAliasByResponseUrl
    }

    const feedUrl = await chooseFeedUrl(feedData)

    const [existingChannelByFeedUrl] = await tx
      .select()
      .from(tables.channels)
      .where(eq(tables.channels.feedUrl, feedUrl))
      .limit(1)
      .for('update')

    if (existingChannelByFeedUrl) {
      const [alias] = await tx
        .insert(tables.aliases)
        .values({
          aliasUrl: feedData.meta.responseUrl,
          channelId: existingChannelByFeedUrl.id,
        })
        .onConflictDoNothing()
        .returning()

      return { channel: existingChannelByFeedUrl, alias }
    }

    const [channel] = await tx
      .insert(tables.channels)
      .values({
        ...feedData.channel,
        feedUrl,
        feedType: feedData.meta.type,
        lastScannedAt: new Date(),
        lastScanStatus: 'scanned',
        lastScanEtag: feedData.meta.etag,
        lastScanHash: feedData.meta.hash,
        lastScanError: null,
      })
      .returning()
    const [alias] = await tx
      .insert(tables.aliases)
      .values({
        aliasUrl: feedData.meta.responseUrl,
        channelId: channel.id,
      })
      .returning()

    insertItems(channel, feedData.items, tx)

    return { channel, alias }
  })
}
