import { createInsertSchema } from 'drizzle-zod'
import { z } from 'zod'
import { fetchOrCreateChannel } from '~/actions/fetchOrCreateChannel'
import { fetchRecordById } from '~/actions/fetchRecordById'
import { updateRecordById } from '~/actions/updateRecordById'
import { sources } from '~/database/tables'
import { HttpError, parseRequestToSchema } from '~/helpers/routes'
import { db } from '~/instances/database'
import { app } from '~/instances/server'

app.get('/sources', async (request, reply) => {
    const sources = await db.query.sources.findMany({
        orderBy: (sources, { desc }) => desc(sources.createdAt),
    })

    return reply.send(sources)
})

app.post('/sources', async (request, reply) => {
    const schema = z.object({
        body: createInsertSchema(sources).omit({ channelId: true }).extend({
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

app.get('/sources/:id', async (request, reply) => {
    const source = await fetchRecordById(request, sources)

    return reply.send(source)
})

app.patch('/sources/:id', async (request, reply) => {
    const updatedSource = await updateRecordById(request, sources, ['name', 'isReadabilitified'])

    return reply.send(updatedSource)
})
