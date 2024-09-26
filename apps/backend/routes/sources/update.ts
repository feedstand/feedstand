import { createRoute, z } from '@hono/zod-openapi'
import { eq } from 'drizzle-orm'
import { createSelectSchema } from 'drizzle-zod'
import { pick } from 'lodash-es'
import { tables } from '../../database/tables'
import { db } from '../../instances/database'
import { hono } from '../../instances/hono'

export const route = createRoute({
    method: 'patch',
    path: '/sources/{id}',
    request: {
        params: z.object({ id: z.coerce.number() }),
        body: {
            content: {
                'application/json': {
                    schema: createSelectSchema(tables.sources).pick({
                        name: true,
                        isReadabilitified: true,
                    }),
                },
            },
            description: '',
        },
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
    tags: ['Sources'],
})

hono.openapi(route, async (context) => {
    const params = context.req.valid('param')
    const json = context.req.valid('json')

    const [existingSource] = await db
        .select()
        .from(tables.sources)
        .where(eq(tables.sources.id, params.id))
        .limit(1)

    if (!existingSource) {
        return context.notFound()
    }

    const fields = ['name', 'isReadabilitified']
    const [updatedSource] = await db
        .update(tables.sources)
        .set({ ...existingSource, ...pick(json, fields) })
        .where(eq(tables.sources.id, existingSource.id))
        .returning()

    return context.json(updatedSource, 200)
})
