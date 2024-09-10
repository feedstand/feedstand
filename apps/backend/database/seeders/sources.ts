import { generateSource } from '../factories/source.js'
import { random, sampleSize } from 'lodash-es'
import { db } from '../index.js'
import { channels, sources, users } from '../tables.js'
import { NewSource } from '../types.js'

export const seedSources = async () => {
    const newSources: Array<NewSource> = []
    const allUsers = await db.select().from(users)
    const allChannels = await db.select().from(channels)

    for (const user of allUsers) {
        const randomChannels = sampleSize(allChannels, random(1, allChannels.length))

        for (const channel of randomChannels) {
            newSources.push(generateSource({ userId: user.id, channelId: channel.id }))
        }
    }

    await db.insert(sources).values(newSources)
}
