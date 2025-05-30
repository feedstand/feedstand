import { tables } from '../database/tables.ts'
import { db } from '../instances/database.ts'
import type { Transaction } from '../types/database.ts'
import type { Channel, FeedItem, NewItem } from '../types/schemas.ts'

const ITEMS_CHUNK_SIZE = 5000

export const insertItems = async (channel: Channel, items: Array<FeedItem>, tx?: Transaction) => {
  if (items.length === 0) {
    return
  }

  const newItems: Array<NewItem> = []

  for (const newItem of items) {
    newItems.push({ ...newItem, channelId: channel.id })
  }

  // TODO: If at some point it is considered to only store X number of recent items for each
  // channel, this can be updated to cap inserted items AND removing the existing ones exceeding
  // the X number of recent items.
  for (let i = 0; i < newItems.length; i += ITEMS_CHUNK_SIZE) {
    const chunkItems = newItems.slice(i, i + ITEMS_CHUNK_SIZE)

    await (tx || db)
      .insert(tables.items)
      .values(chunkItems)
      .onConflictDoNothing({
        target: [tables.items.channelId, tables.items.itemHash, tables.items.contentHash],
      })
  }
}
