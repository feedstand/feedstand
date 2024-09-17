import { app } from '~/instances/server.js'
import { parseRequestToSchema } from '~/helpers/routes.js'
import { z } from 'zod'
import { db } from '~/instances/database.js'

app.get('/channels/:id/items', async (request, reply) => {
    const schema = z.object({ params: z.object({ id: z.coerce.number() }) })
    const { params } = parseRequestToSchema({ request, reply, schema })

    const channel = await db.query.channels.findFirst({
        where: (channels, { eq }) => eq(channels.id, params.id),
        columns: { id: true },
    })

    if (!channel) {
        // TODO: Implement custom error class and handling them in Fastify.
        throw new Error()
    }

    const items = await db.query.items.findMany({
        where: (items, { eq }) => eq(items.channelId, params.id),
        orderBy: (items, { desc }) => desc(items.publishedAt),
    })

    return reply.send(items)
})
