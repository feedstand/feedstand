import { createInsertSchema } from 'drizzle-zod'
import { z } from 'zod'
import { fetchOrCreateChannel } from '~/actions/fetchOrCreateChannel'
import { sources } from '~/database/tables'
import { parseRequestToSchema } from '~/helpers/routes'
import { db } from '~/instances/database'
import { app } from '~/instances/server'

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
