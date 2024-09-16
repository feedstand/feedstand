import { random } from 'lodash-es'
import { db } from '~/instances/database.js'
import { channels, items } from '../tables.js'
import { NewItem } from '~/types/database.js'
import { generateItem } from '../factories/item.js'

export const seedItems = async () => {
    const newItems: Array<NewItem> = []
    const allChannels = await db.select().from(channels)

    for (let i = 0; i < 100; ++i) {
        const randomChannel = allChannels[random(0, allChannels.length - 1)]

        newItems.push(generateItem({ channelId: randomChannel.id }))
    }

    await db.insert(items).values(newItems)
}
