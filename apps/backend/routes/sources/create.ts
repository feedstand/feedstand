import { createInsertSchema } from 'drizzle-zod'
import { z } from 'zod'
import { fetchOrCreateChannel } from '~/actions/fetchOrCreateChannel'
import { tables } from '~/database/tables'
import { validate } from '~/helpers/routes'
import { db } from '~/instances/database'
import { hono } from '~/instances/hono'

const jsonSchema = createInsertSchema(tables.sources)
    .omit({ channelId: true })
    .extend({ url: z.string().url() })

hono.post('/sources', validate('json', jsonSchema), async (context) => {
    const json = context.req.valid('json')

    const channel = await fetchOrCreateChannel(json.url)

    const [source] = await db
        .insert(tables.sources)
        .values({ ...json, channelId: channel.id })
        .returning()

    return context.json(source, 201)
})
