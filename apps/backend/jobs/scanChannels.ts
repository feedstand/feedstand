import { gt } from 'drizzle-orm'
import { tables } from '../database/tables'
import { sleep } from '../helpers/system'
import { db } from '../instances/database'
import { channelQueue } from '../queues/channel'

const CHANNELS_CHUNK_SIZE = 5000
const CHANNELS_CHUNK_DELAY = 100

export const scanChannels = async () => {
    // TODO: Consider adding support for adjusting scanning frequency based on the actual new items
    // being added to the feed. Elegant solution: https://stackoverflow.com/a/6651638.

    let lastId = 0

    while (true) {
        const channels = await db
            .select()
            .from(tables.channels)
            .where(gt(tables.channels.id, lastId))
            .orderBy(tables.channels.id)
            .limit(CHANNELS_CHUNK_SIZE)

        if (channels.length === 0) {
            break
        }

        for (const channel of channels) {
            await channelQueue.add('scanChannel', channel)
        }

        lastId = channels[channels.length - 1].id

        await sleep(CHANNELS_CHUNK_DELAY)
    }
}
