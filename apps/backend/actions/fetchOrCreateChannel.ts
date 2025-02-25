import { eq } from 'drizzle-orm'
import { fetchFeed } from '../actions/fetchFeed'
import { tables } from '../database/tables'
import { db } from '../instances/database'
import { Channel } from '../types/schemas'
import { fetchUrl } from './fetchUrl'
import { insertItems } from './insertItems'

const fetchExistingChannel = async (feedUrl: string) => {
  const [existingChannel] = await db
    .select()
    .from(tables.channels)
    .where(eq(tables.channels.feedUrl, feedUrl))
    .limit(1)

  return existingChannel
}

export const fetchOrCreateChannel = async (url: string): Promise<Channel> => {
  // First, check if a channel already exists in the database with the provided URL as is.
  // This is an optimization to avoid unnecessary network requests if the URL is already known.
  let feedUrl = url
  let existingChannel = await fetchExistingChannel(feedUrl)

  // If no channel was found with the initial URL, it's possible the provided URL is an old feed
  // URL that has been redirected to a new, canonical URL.
  if (!existingChannel) {
    feedUrl = (await fetchUrl(feedUrl, { method: 'head' })).url
    existingChannel = await fetchExistingChannel(feedUrl)
  }

  if (existingChannel) {
    return existingChannel
  }

  const feedData = await fetchFeed({ url: feedUrl })

  const [newChannel] = await db
    .insert(tables.channels)
    .values({
      ...feedData.channel,
      lastScannedAt: new Date(),
      lastScanEtag: feedData.etag,
    })
    .returning()

  insertItems(newChannel, feedData.items)

  return newChannel
}
