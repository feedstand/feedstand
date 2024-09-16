import { generateChannel } from '../factories/channel.js'
import { db } from '~/instances/database.js'
import { channels } from '~/database/tables.js'

export const seedChannels = async () => {
    await db.insert(channels).values([
        generateChannel({
            url: 'https://zenhabits.net/feed/',
            title: 'zen habits',
            link: 'https://zenhabits.net',
            description: 'breathe',
        }),
        generateChannel({
            url: 'https://www.thedailyzen.org/feed/',
            title: 'DAILY ZEN',
            link: 'https://www.thedailyzen.org',
            description: undefined,
        }),
        generateChannel({
            url: 'http://deconstructingyourself.com/feed',
            title: 'Deconstructing Yourself',
            link: 'http://deconstructingyourself.com',
            description: 'Mindfulness, Meditation, and Awakening for Modern Mutants',
        }),
    ])
}
