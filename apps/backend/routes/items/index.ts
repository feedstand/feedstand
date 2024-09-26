import { createRoute, z } from '@hono/zod-openapi'
import { desc, eq } from 'drizzle-orm'
import { createSelectSchema } from 'drizzle-zod'
import { tables } from '../../database/tables'
import { db } from '../../instances/database'
import { hono } from '../../instances/hono'

export const route = createRoute({
    method: 'get',
    path: '/channels/{id}/items',
    request: {
        params: z.object({ id: z.coerce.number() }),
    },
    responses: {
        200: {
            content: { 'application/json': { schema: z.array(createSelectSchema(tables.items)) } },
            description: 'Show all Items belonging to a specific Channel.',
        },
        404: {
            description: 'Channel was not found.',
        },
    },
    tags: ['Items'],
})

hono.openapi(route, async (context) => {
    const params = context.req.valid('param')

    const [channel] = await db
        .select()
        .from(tables.channels)
        .where(eq(tables.channels.id, params.id))
        .limit(1)

    if (!channel) {
        return context.notFound()
    }

    const items = await db
        .select()
        .from(tables.items)
        .where(eq(tables.items.channelId, channel.id))
        .orderBy(desc(tables.items.publishedAt))

    return context.json(items, 200)
})
