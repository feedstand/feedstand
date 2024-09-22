import { generateSource } from '../factories/source'
import { random, sampleSize } from 'lodash-es'
import { db } from '~/instances/database'
import { channels, sources, users } from '../tables'
import { NewSource } from '~/types/database'

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
