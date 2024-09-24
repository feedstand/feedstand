import { eq } from 'drizzle-orm'
import { createRoute, z } from '@hono/zod-openapi'
import { tables } from '~/database/tables'
import { db } from '~/instances/database'
import { hono } from '~/instances/hono'
import { createSelectSchema } from 'drizzle-zod'

const route = createRoute({
    method: 'get',
    path: '/channels/{id}',
    request: {
        params: z.object({ id: z.coerce.number() }),
    },
    responses: {
        200: {
            content: { 'application/json': { schema: createSelectSchema(tables.channels) } },
            description: '',
        },
        404: {
            description: '',
        },
    },
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

    return context.json(channel)
})
