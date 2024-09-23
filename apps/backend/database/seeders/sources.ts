import { generateSource } from '../factories/source'
import { random, sampleSize } from 'lodash-es'
import { db } from '~/instances/database'
import { tables } from '../tables'
import { NewSource } from '~/types/database'

export const seedSources = async () => {
    const newSources: Array<NewSource> = []
    const allUsers = await db.select().from(tables.users)
    const allChannels = await db.select().from(tables.channels)

    for (const user of allUsers) {
        const randomChannels = sampleSize(allChannels, random(1, allChannels.length))

        for (const channel of randomChannels) {
            newSources.push(generateSource({ userId: user.id, channelId: channel.id }))
        }
    }

    await db.insert(tables.sources).values(newSources)
}
