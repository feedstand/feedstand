import { app } from '~/instances/server'
import { fetchRecord } from '~/actions/fetchRecord'
import { tables } from '~/database/tables'
import { desc, eq } from 'drizzle-orm'
import { db } from '~/instances/database'

app.get('/channels/:id/items', async (request, reply) => {
    const channel = await fetchRecord(request, tables.channels)
    const items = await db
        .select()
        .from(tables.items)
        .where(eq(tables.items.channelId, channel.id))
        .orderBy(desc(tables.items.publishedAt))

    return reply.send(items)
})
