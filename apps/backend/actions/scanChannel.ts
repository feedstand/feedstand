import { eq } from 'drizzle-orm'
import { channels } from '~/database/tables.js'
import { db } from '~/instances/database.js'

export const scanChannel = async (channelId: number) => {
    console.log(`Perform scanning of Channel #${channelId}`)

    await db
        .update(channels)
        .set({ lastScannedAt: new Date() })
        .where(eq(channels.id, BigInt(channelId)))
}
