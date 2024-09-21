import { app } from '~/instances/server'
import { db } from '~/instances/database'
import { fetchChannelById } from '~/actions/fetchChannelById'

app.get('/channels/:id/items', async (request, reply) => {
    const channel = await fetchChannelById(request)
    const items = await db.query.items.findMany({
        where: (items, { eq }) => eq(items.channelId, channel.id),
        orderBy: (items, { desc }) => desc(items.publishedAt),
    })

    return reply.send(items)
})
