import { app } from '~/instances/server.js'
import { db } from '~/instances/database.js'
import { fetchChannelById } from '~/actions/fetchChannelById.js'

app.get('/channels/:id/items', async (request, reply) => {
    const channel = await fetchChannelById(request)
    const items = await db.query.items.findMany({
        where: (items, { eq }) => eq(items.channelId, channel.id),
        orderBy: (items, { desc }) => desc(items.publishedAt),
    })

    return reply.send(items)
})
