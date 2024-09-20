import { eq } from 'drizzle-orm'
import { channels, items } from '~/database/tables.js'
import { db } from '~/instances/database.js'
import { Channel, NewItem } from '~/types/database.js'
import { fetchAndParseFeed } from './fetchAndParseFeed.js'

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
        .insert(items)
        .values(newItems)
        .onConflictDoNothing({ target: [items.channelId, items.guid] })

    await db
        .update(channels)
        .set({ ...feed.channel, lastScannedAt: new Date() })
        .where(eq(channels.id, channel.id))
}
