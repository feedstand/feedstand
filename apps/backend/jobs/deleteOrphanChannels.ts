import { subDays } from 'date-fns'
import { and, eq, inArray, isNull, lt } from 'drizzle-orm'
import { tables } from '../database/tables'
import { db } from '../instances/database'

export const deleteOrphanChannels = async () => {
    const oneDayAgo = subDays(new Date(), 1)

    const orphanChannelsSubquery = db
        .select({ id: tables.channels.id })
        .from(tables.channels)
        .leftJoin(tables.sources, eq(tables.sources.channelId, tables.channels.id))
        .where(and(isNull(tables.sources.id), lt(tables.channels.createdAt, oneDayAgo)))

    await db
        .delete(tables.channels)
        .where(inArray(tables.channels.id, orphanChannelsSubquery))
        .returning()
}
