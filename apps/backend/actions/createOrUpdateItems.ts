import { tables } from '../database/tables'
import { db } from '../instances/database'
import { Channel, FeedItem, NewItem } from '../types/schemas'

const ITEMS_CHUNK_SIZE = 5000

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

    // Store items in chunks for cases where the large number of items would cause Postgres error
    // "MAX_PARAMETERS_EXCEEDED: Max number of parameters (65534) exceeded".
    // TODO: IF at any point it is considered to only store X amount of recent items for each
    // channel, this could be updated to cap inserted items.
    for (let i = 0; i < newItems.length; i += ITEMS_CHUNK_SIZE) {
        const chunkItems = newItems.slice(i, i + ITEMS_CHUNK_SIZE)

        await db
            .insert(tables.items)
            .values(chunkItems)
            .onConflictDoNothing({ target: [tables.items.channelId, tables.items.guid] })
    }
}
