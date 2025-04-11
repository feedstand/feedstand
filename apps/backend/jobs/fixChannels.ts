import { subDays } from 'date-fns'
import { and, eq, gt, isNull, lte, ne, or, type SQL } from 'drizzle-orm'
import { tables } from '../database/tables.js'
import { db } from '../instances/database.js'
import { channelQueue } from '../queues/channel.js'

const CHANNELS_CHUNK_SIZE = 5000

export const fixChannels = async () => {
  let lastId = 0

  const conditions: Array<SQL | undefined> = [
    and(
      // Only Channels that were already scanned and returned error the last time.
      eq(tables.channels.lastScanStatus, 'failed'),
      or(
        // Once in 30 days: Channels which were successfully fixes-checked.
        and(
          ne(tables.channels.lastFixCheckStatus, 'failed'),
          lte(tables.channels.lastFixCheckedAt, subDays(new Date(), 30)),
        ),
        // Once in 14 days: Channels which failed fixes check the last time.
        // TODO: Consider different types of errors and whether to perform the fix check
        // more frequently when certain type of error occurs (eg. network error).
        and(
          eq(tables.channels.lastFixCheckStatus, 'failed'),
          lte(tables.channels.lastFixCheckedAt, subDays(new Date(), 14)),
        ),
        // Always: Channels that were never scanned for fixes.
        isNull(tables.channels.lastFixCheckedAt),
      ),
    ),
  ]

  while (true) {
    const channels = await db
      .select()
      .from(tables.channels)
      .where(and(gt(tables.channels.id, lastId), ...conditions))
      .orderBy(tables.channels.id)
      .limit(CHANNELS_CHUNK_SIZE)

    if (channels.length === 0) {
      break
    }

    await channelQueue.addBulk(
      channels.map((data) => ({
        name: 'fixChannel',
        data,
      })),
    )

    lastId = channels[channels.length - 1].id
  }
}
