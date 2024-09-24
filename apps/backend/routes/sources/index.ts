import { createRoute, z } from '@hono/zod-openapi'
import { desc } from 'drizzle-orm'
import { createSelectSchema } from 'drizzle-zod'
import { tables } from '~/database/tables'
import { db } from '~/instances/database'
import { hono } from '~/instances/hono'

const route = createRoute({
    method: 'get',
    path: '/sources',
    responses: {
        200: {
            content: {
                'application/json': { schema: z.array(createSelectSchema(tables.sources)) },
            },
            description: '',
        },
    },
})

hono.openapi(route, async (context) => {
    const sources = await db.select().from(tables.sources).orderBy(desc(tables.sources.createdAt))

    return context.json(sources, 200)
})
