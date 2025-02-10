import { tables } from '../../database/tables'
import { db } from '../../instances/database'
import { generateChannel } from '../factories/channel'

export const seedChannels = async () => {
    await db.insert(tables.channels).values([
        generateChannel({
            title: 'zen habits',
            siteUrl: 'https://zenhabits.net',
            feedUrl: 'https://zenhabits.net/feed',
            description: 'breathe',
            lastScannedAt: undefined,
        }),
        generateChannel({
            title: 'Deconstructing Yourself',
            siteUrl: 'http://deconstructingyourself.com',
            feedUrl: 'http://deconstructingyourself.com/feed',
            description: 'Mindfulness, Meditation, and Awakening for Modern Mutants',
            lastScannedAt: undefined,
        }),
        generateChannel({
            title: 'Daring Fireball',
            siteUrl: 'https://daringfireball.net',
            feedUrl: 'https://daringfireball.net/feeds/json',
            description: undefined,
            lastScannedAt: undefined,
        }),
    ])
}
