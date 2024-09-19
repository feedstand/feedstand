import { createInsertSchema } from 'drizzle-zod'
import { z } from 'zod'
import { fetchOrCreateChannel } from '~/actions/fetchOrCreateChannel.js'
import { sources } from '~/database/tables.js'
import { parseRequestToSchema } from '~/helpers/routes.js'
import { db } from '~/instances/database.js'
import { app } from '~/instances/server.js'

app.post('/sources', async (request, reply) => {
    const schema = z.object({
        body: createInsertSchema(sources, { channelId: z.undefined() }).extend({
            url: z.string().url(),
        }),
    })
    const { body } = parseRequestToSchema({ request, schema, showErrors: true })

    const channel = await fetchOrCreateChannel(body.url)
    const [source] = await db
        .insert(sources)
        .values({ ...body, channelId: channel.id })
        .returning()

    return reply.status(201).send(source)
})
