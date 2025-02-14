import { and, gt, or, SQL } from 'drizzle-orm'
import { performance } from 'node:perf_hooks'
import { tables } from '../database/tables'
import { db } from '../instances/database'
import { channelQueue } from '../queues/channel'

const CHANNELS_CHUNK_SIZE = 5000

export const scanChannels = async () => {
    let lastId = 0

    const conditions: Array<SQL | undefined> = [
        or(),
        // TODO: Consider adding support for adjusting scanning frequency based on the actual new
        // items being added to the feed. Elegant solution: https://stackoverflow.com/a/6651638.
    ]

    while (true) {
        const startTime = performance.now()

        const channels = await db
            .select()
            .from(tables.channels)
            .where(and(gt(tables.channels.id, lastId), ...conditions))
            .orderBy(tables.channels.id)
            .limit(CHANNELS_CHUNK_SIZE)

        const queryTime = performance.now() - startTime

        if (channels.length === 0) {
            break
        }

        const queueStart = performance.now()

        await channelQueue.addBulk(
            channels.map((data) => ({
                name: 'scanChannel',
                data,
            })),
        )

        const queueTime = performance.now() - queueStart

        console.log({
            batchSize: channels.length,
            queryTimeMs: queryTime.toFixed(2),
            queueTimeMs: queueTime.toFixed(2),
            recordsPerSecond: (channels.length / ((queryTime + queueTime) / 1000)).toFixed(2),
        })

        lastId = channels[channels.length - 1].id
    }
}
