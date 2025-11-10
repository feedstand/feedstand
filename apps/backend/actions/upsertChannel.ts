import { eq } from 'drizzle-orm'
import { fetchFeed } from '../actions/fetchFeed.ts'
import { tables } from '../database/tables.ts'
import { db } from '../instances/database.ts'
import type { Database, Transaction } from '../types/database.ts'
import type { Alias, Channel } from '../types/schemas.ts'
import { chooseFeedUrl } from './chooseFeedUrl.ts'
import type { FetchUrlResponse } from './fetchUrl.ts'
import { insertItems } from './insertItems.ts'

const fetchExistingChannelAndAlias = async (aliasUrl: string, dbOrTx: Database | Transaction) => {
  const [existingChannelAndAlias] = await dbOrTx
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

export type UpsertResponse = (options: {
  url: string
  response?: FetchUrlResponse
  omitsInsertingItems?: boolean
}) => Promise<{
  channel: Channel
  alias: Alias
}>

export const upsertChannel: UpsertResponse = async ({
  url: requestUrl,
  response,
  omitsInsertingItems,
}) => {
  const existingChannelAndAliasByRequestUrl = await fetchExistingChannelAndAlias(requestUrl, db)

  if (existingChannelAndAliasByRequestUrl) {
    return existingChannelAndAliasByRequestUrl
  }

  const feedData = await fetchFeed({ url: requestUrl, response })
  const feedUrl = await chooseFeedUrl(feedData)

  return db.transaction(async (tx) => {
    const existingChannelAndAliasByResponseUrl = await fetchExistingChannelAndAlias(
      feedData.meta.responseUrl,
      tx,
    )

    if (existingChannelAndAliasByResponseUrl) {
      return existingChannelAndAliasByResponseUrl
    }

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
      .onConflictDoNothing()
      .returning()
    const [alias] = await tx
      .insert(tables.aliases)
      .values({
        aliasUrl: feedData.meta.responseUrl,
        channelId: channel.id,
      })
      .returning()

    if (!omitsInsertingItems) {
      insertItems(channel, feedData.items, tx)
    }

    return { channel, alias }
  })
}
