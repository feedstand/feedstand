import { dayjs } from '~/instances/dayjs.js'
import { and, eq, inArray, isNull, lt } from 'drizzle-orm'
import { channels, sources } from '~/database/tables.js'
import { db } from '~/instances/database.js'

export const deleteOrphanChannels = async () => {
    const oneDayAgo = dayjs().subtract(1, 'day').toDate()

    const orphanChannelsSubquery = db
        .select({ id: channels.id })
        .from(channels)
        .leftJoin(sources, eq(sources.channelId, channels.id))
        .where(and(isNull(sources.id), lt(channels.createdAt, oneDayAgo)))

    const deletedChannels = await db
        .delete(channels)
        .where(inArray(channels.id, orphanChannelsSubquery))
        .returning()

    return deletedChannels
}
