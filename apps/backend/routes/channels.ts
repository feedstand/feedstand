import { app } from '~/instances/server.js'
import { parseRequestToSchema } from '~/helpers/routes.js'
import { z } from 'zod'
import { db } from '~/instances/database.js'

app.get('/channels/:id', async (request, reply) => {
    const schema = z.object({ params: z.object({ id: z.coerce.number() }) })
    const { params } = parseRequestToSchema({ request, reply, schema })

    const channel = await db.query.items.findFirst({
        where: (channels, { eq }) => eq(channels.id, params.id),
    })

    return reply.send(channel)
})
