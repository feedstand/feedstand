import { subDays } from 'date-fns'
import { and, eq, exists, inArray, lt, not } from 'drizzle-orm'
import { tables } from '../database/tables.ts'
import { db } from '../instances/database.ts'

export const deleteOrphanChannels = async () => {
  const oneDayAgo = subDays(new Date(), 1)

  const orphanChannelsSubquery = db
    .select({ id: tables.channels.id })
    .from(tables.channels)
    .where(
      and(
        lt(tables.channels.createdAt, oneDayAgo),
        not(
          exists(
            db
              .select({ id: tables.sources.id })
              .from(tables.sources)
              .innerJoin(
                tables.aliases,
                and(
                  eq(tables.sources.aliasId, tables.aliases.id),
                  eq(tables.aliases.channelId, tables.channels.id),
                ),
              ),
          ),
        ),
      ),
    )

  await db.delete(tables.channels).where(inArray(tables.channels.id, orphanChannelsSubquery))
}
