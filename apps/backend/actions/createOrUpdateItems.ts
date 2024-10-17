import { tables } from '../database/tables'
import { db } from '../instances/database'
import { Channel, FeedItem, NewItem } from '../types/schemas'

export const createOrUpdateItems = async (channel: Channel, items: Array<FeedItem>) => {
    if (items.length === 0) {
        return
    }

    const newItems: Array<NewItem> = []

    for (const newItem of items) {
        newItems.push({ ...newItem, channelId: channel.id })
    }

    // TODO: If necessary, update contents of the existing Items so that if feed item is updated,
    // we always store the newest version of it.
    // Consideration: Should the changes history be kept to highlight changes in the Item?

    await db
        .insert(tables.items)
        .values(newItems)
        .onConflictDoNothing({ target: [tables.items.channelId, tables.items.guid] })
}
