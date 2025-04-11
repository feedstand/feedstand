import { and, gt, type SQL } from 'drizzle-orm'
import { tables } from '../database/tables.js'
import { db } from '../instances/database.js'
import { channelQueue } from '../queues/channel.js'

const CHANNELS_CHUNK_SIZE = 5000

export const scanChannels = async () => {
  let lastId = 0

  const conditions: Array<SQL | undefined> = [
    // TODO: Consider adding support for adjusting scanning frequency based on the actual new
    // items being added to the feed. Elegant solution: https://stackoverflow.com/a/6651638.
    // TODO: Respect syndication tags in Atom feeds, eg.:
    // <sy:updatePeriod>hourly</sy:updatePeriod>,
    // <sy:updateFrequency>1</sy:updateFrequency>.
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
        name: 'scanChannel',
        data,
      })),
    )

    lastId = channels[channels.length - 1].id
  }
}
