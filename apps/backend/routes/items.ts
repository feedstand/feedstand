import { app } from '~/instances/server'
import { db } from '~/instances/database'
import { fetchRecordById } from '~/actions/fetchRecordById'
import { channels } from '~/database/tables'

app.get('/channels/:id/items', async (request, reply) => {
    const channel = await fetchRecordById(request, channels)
    const items = await db.query.items.findMany({
        where: (items, { eq }) => eq(items.channelId, channel.id),
        orderBy: (items, { desc }) => desc(items.publishedAt),
    })

    return reply.send(items)
})
