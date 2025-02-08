import { eq } from 'drizzle-orm'
import { fetchFeed } from '../actions/fetchFeed'
import { tables } from '../database/tables'
import { db } from '../instances/database'
import { Channel } from '../types/schemas'
import { createOrUpdateItems } from './createOrUpdateItems'

export const fetchOrCreateChannel = async (url: string): Promise<Channel> => {
    const [existingChannel] = await db
        .select()
        .from(tables.channels)
        .where(eq(tables.channels.url, url))
        .limit(1)

    if (existingChannel) {
        return existingChannel
    }

    const feed = await fetchFeed({ url })
    const [newChannel] = await db.insert(tables.channels).values(feed.channel).returning()

    createOrUpdateItems(newChannel, feed.items)

    return newChannel
}
