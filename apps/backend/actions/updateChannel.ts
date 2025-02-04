import { eq } from 'drizzle-orm'
import { tables } from '../database/tables'
import { db } from '../instances/database'
import { Channel, FeedChannel } from '../types/schemas'

export const updateChannel = async (channel: Channel, updates: FeedChannel) => {
    await db
        .update(tables.channels)
        .set({
            title: updates.title ?? channel.title,
            description: updates.description ?? channel.description,
            link: updates.link ?? channel.link,
            error: null,
            lastScannedAt: new Date(),
        })
        .where(eq(tables.channels.id, channel.id))
}
