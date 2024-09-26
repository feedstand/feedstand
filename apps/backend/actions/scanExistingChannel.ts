import { eq } from 'drizzle-orm'
import { tables } from '../database/tables'
import { db } from '../instances/database'
import { Channel, NewItem } from '../types/database'
import { fetchAndParseFeed } from './fetchAndParseFeed'

export const scanExistingChannel = async (channel: Channel) => {
    const feed = await fetchAndParseFeed(channel.url)

    const newItems: Array<NewItem> = []

    for (const newItem of feed.items) {
        newItems.push({ ...newItem, channelId: channel.id })
    }

    // TODO: If necessary, update contents of the existing Items so that if feed item is updated,
    // we always store the newest version of it.
    // Consideration: Should the changes history be kept to highlight changes in the Item?

    await db
        .insert(tables.items)
        .values(newItems)
        .onConflictDoNothing({ target: [tables.items.channelId, tables.items.guid] })

    await db
        .update(tables.channels)
        .set({ ...feed.channel, lastScannedAt: new Date() })
        .where(eq(tables.channels.id, channel.id))
}
