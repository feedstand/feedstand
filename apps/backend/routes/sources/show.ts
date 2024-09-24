import { createRoute, z } from '@hono/zod-openapi'
import { eq } from 'drizzle-orm'
import { createSelectSchema } from 'drizzle-zod'
import { tables } from '~/database/tables'
import { db } from '~/instances/database'
import { hono } from '~/instances/hono'

const route = createRoute({
    method: 'get',
    path: '/sources/{id}',
    request: {
        params: z.object({ id: z.coerce.number() }),
    },
    responses: {
        200: {
            content: { 'application/json': { schema: createSelectSchema(tables.sources) } },
            description: '',
        },
        404: {
            description: '',
        },
    },
})

hono.openapi(route, async (context) => {
    const params = context.req.valid('param')

    const [source] = await db
        .select()
        .from(tables.sources)
        .where(eq(tables.sources.id, params.id))
        .limit(1)

    if (!source) {
        return context.notFound()
    }

    return context.json(source, 200)
})
