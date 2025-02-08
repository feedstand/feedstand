import { subDays } from 'date-fns'
import { and, gt, isNotNull, isNull, lte, or } from 'drizzle-orm'
import { tables } from '../database/tables'
import { sleep } from '../helpers/system'
import { db } from '../instances/database'
import { channelQueue } from '../queues/channel'

const CHANNELS_CHUNK_SIZE = 5000
const CHANNELS_CHUNK_DELAY = 100

export const fixChannels = async () => {
    let lastId = 0

    while (true) {
        const channels = await db
            .select()
            .from(tables.channels)
            .where(
                and(
                    gt(tables.channels.id, lastId),
                    isNotNull(tables.channels.lastScanError),
                    or(
                        // Every 7 days perform a fix attempt on Channels which were successfully
                        // scanned for fixes.
                        and(
                            isNull(tables.channels.lastFixCheckError),
                            lte(tables.channels.lastFixCheckedAt, subDays(new Date(), 7)),
                        ),
                        // Every 30 days perform a fix attempt on Channels which failed fixes scan.
                        and(
                            isNotNull(tables.channels.lastFixCheckError),
                            lte(tables.channels.lastFixCheckedAt, subDays(new Date(), 30)),
                        ),
                        // Every time this runs, perform a fix attempt on Channels that were never
                        // scanned for fixes.
                        and(
                            isNull(tables.channels.lastFixCheckError),
                            isNull(tables.channels.lastFixCheckedAt),
                        ),
                    ),
                ),
            )
            .orderBy(tables.channels.id)
            .limit(CHANNELS_CHUNK_SIZE)

        if (channels.length === 0) {
            break
        }

        for (const channel of channels) {
            await channelQueue.add('fixChannel', channel)
        }

        lastId = channels[channels.length - 1].id

        await sleep(CHANNELS_CHUNK_DELAY)
    }
}
