import { desc } from 'drizzle-orm'
import { createInsertSchema } from 'drizzle-zod'
import { z } from 'zod'
import { fetchOrCreateChannel } from '~/actions/fetchOrCreateChannel'
import { fetchRecord } from '~/actions/fetchRecord'
import { updateRecord } from '~/actions/updateRecord'
import { tables } from '~/database/tables'
import { parseRequestToSchema } from '~/helpers/routes'
import { db } from '~/instances/database'
import { app } from '~/instances/server'

app.get('/sources', async (request, reply) => {
    const sources = await db.select().from(tables.sources).orderBy(desc(tables.sources.createdAt))

    return reply.send(sources)
})

app.post('/sources', async (request, reply) => {
    const schema = z.object({
        body: createInsertSchema(tables.sources)
            .omit({ channelId: true })
            .extend({ url: z.string().url() }),
    })
    const { body } = parseRequestToSchema({ request, schema, showErrors: true })

    const channel = await fetchOrCreateChannel(body.url)
    const [source] = await db
        .insert(tables.sources)
        .values({ ...body, channelId: channel.id })
        .returning()

    return reply.status(201).send(source)
})

app.get('/sources/:id', async (request, reply) => {
    const source = await fetchRecord(request, tables.sources)

    return reply.send(source)
})

app.patch('/sources/:id', async (request, reply) => {
    const updatedSource = await updateRecord(request, tables.sources, ['name', 'isReadabilitified'])

    return reply.send(updatedSource)
})
