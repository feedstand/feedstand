import { app } from '~/instances/server.js'
import { HttpError, parseRequestToSchema } from '~/helpers/routes.js'
import { z } from 'zod'
import { db } from '~/instances/database.js'

app.get('/channels/:id/items', async (request, reply) => {
    const schema = z.object({ params: z.object({ id: z.coerce.number() }) })
    const { params } = parseRequestToSchema({ request, schema })

    const channel = await db.query.channels.findFirst({
        where: (channels, { eq }) => eq(channels.id, params.id),
        columns: { id: true },
    })

    if (!channel) {
        throw new HttpError(404)
    }

    const items = await db.query.items.findMany({
        where: (items, { eq }) => eq(items.channelId, params.id),
        orderBy: (items, { desc }) => desc(items.publishedAt),
    })

    return reply.send(items)
})
