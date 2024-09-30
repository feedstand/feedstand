import { createRoute, z } from '@hono/zod-openapi'
import { desc } from 'drizzle-orm'
import { tables } from '../../database/tables'
import { createHandler } from '../../helpers/hono'
import { db } from '../../instances/database'
import { source } from '../../schemas/source'

export const route = createRoute({
    method: 'get',
    path: '/sources',
    responses: {
        200: {
            content: {
                'application/json': { schema: z.array(source) },
            },
            description: '',
        },
    },
})

export const handler = createHandler(route, async (context) => {
    const sources = await db.select().from(tables.sources).orderBy(desc(tables.sources.createdAt))

    return context.json(sources, 200)
})
