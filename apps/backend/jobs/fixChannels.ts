import { and, gt, isNotNull } from 'drizzle-orm'
import { tables } from '../database/tables'
import { db } from '../instances/database'
import { channelQueue } from '../queues/channel'

const CHANNELS_CHUNK_SIZE = 5000
const CHANNELS_CHUNK_DELAY = 5000

export const fixChannels = async () => {
    let lastId = 0

    while (true) {
        const channels = await db
            .select()
            .from(tables.channels)
            .where(and(gt(tables.channels.id, lastId), isNotNull(tables.channels.error)))
            .orderBy(tables.channels.id)
            .limit(CHANNELS_CHUNK_SIZE)

        if (channels.length === 0) {
            break
        }

        for (const channel of channels) {
            await channelQueue.add('fixChannel', channel)
        }

        lastId = channels[channels.length - 1].id

        // await sleep(CHANNELS_CHUNK_DELAY)
    }
}
