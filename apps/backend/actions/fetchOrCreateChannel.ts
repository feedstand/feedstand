import { eq } from 'drizzle-orm'
import { fetchFeed } from '../actions/fetchFeed'
import { tables } from '../database/tables'
import { db } from '../instances/database'
import { Channel } from '../types/schemas'
import { insertItems } from './insertItems'
import { resolveRedirectUrl } from './resolveRedirectUrl'

const fetchExistingChannel = async (feedUrl: string): Promise<Channel | undefined> => {
  const [existingChannel] = await db
    .select()
    .from(tables.channels)
    .where(eq(tables.channels.feedUrl, feedUrl))
    .limit(1)

  return existingChannel
}

export const fetchOrCreateChannel = async (originalUrl: string): Promise<Channel> => {
  // First, check if a channel already exists in the database with the provided URL as is.
  // This is an optimization to avoid unnecessary network requests if the URL is already known.
  let feedUrl = originalUrl
  let existingChannel = await fetchExistingChannel(feedUrl)

  // If no channel was found with the initial URL, it's possible the provided URL is an old feed
  // URL that has been redirected to a new, canonical URL.
  if (!existingChannel) {
    feedUrl = await resolveRedirectUrl(feedUrl)
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
