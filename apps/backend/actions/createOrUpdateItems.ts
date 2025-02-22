import { sql } from 'drizzle-orm'
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

  // TODO: IF at any point it is considered to only store X amount of recent items for each
  // channel, this could be updated to cap inserted items.
  for (let i = 0; i < newItems.length; i += ITEMS_CHUNK_SIZE) {
    const chunkItems = newItems.slice(i, i + ITEMS_CHUNK_SIZE)

    await db
      .insert(tables.items)
      .values(chunkItems)
      .onConflictDoUpdate({
        target: [tables.items.channelId, tables.items.itemChecksum, tables.items.contentChecksum],
        set: {
          rawPublishedAt: sql`excluded.raw_published_at`,
        },
      })
  }
}
