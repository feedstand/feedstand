import { random } from 'lodash-es'
import { db } from '../../instances/database.js'
import type { NewItem } from '../../types/schemas.js'
import { generateItem } from '../factories/item.js'
import { tables } from '../tables.js'

export const seedItems = async () => {
  const newItems: Array<NewItem> = []
  const allChannels = await db.select().from(tables.channels)

  for (let i = 0; i < 100; ++i) {
    const randomChannel = allChannels[random(0, allChannels.length - 1)]

    newItems.push(generateItem({ channelId: randomChannel.id }))
  }

  await db.insert(tables.items).values(newItems)
}
