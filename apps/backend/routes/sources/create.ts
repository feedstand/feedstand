import { createRoute, z } from '@hono/zod-openapi'
import { createInsertSchema, createSelectSchema } from 'drizzle-zod'
import { fetchOrCreateChannel } from '~/actions/fetchOrCreateChannel'
import { tables } from '~/database/tables'
import { db } from '~/instances/database'
import { hono } from '~/instances/hono'

const route = createRoute({
    method: 'post',
    path: '/sources',
    request: {
        body: {
            content: {
                'application/json': {
                    schema: createInsertSchema(tables.sources)
                        .omit({ channelId: true })
                        .extend({ url: z.string().url() }),
                },
            },
            description: '',
        },
    },
    responses: {
        201: {
            content: { 'application/json': { schema: createSelectSchema(tables.sources) } },
            description: '',
        },
    },
    tags: ['Sources'],
})

hono.openapi(route, async (context) => {
    const json = context.req.valid('json')

    const channel = await fetchOrCreateChannel(json.url)

    const [source] = await db
        .insert(tables.sources)
        .values({ ...json, channelId: channel.id })
        .returning()

    return context.json(source, 201)
})
