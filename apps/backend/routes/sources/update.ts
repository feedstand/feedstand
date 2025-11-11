import { createRoute, z } from '@hono/zod-openapi'
import { eq } from 'drizzle-orm'
import { HTTPException } from 'hono/http-exception'
import { tables } from '../../database/tables.ts'
import { createHandler } from '../../helpers/hono.ts'
import { db } from '../../instances/database.ts'
import { source } from '../../schemas/source.ts'

export const route = createRoute({
  method: 'patch',
  path: '/sources/{id}',
  request: {
    params: z.object({ id: z.coerce.number() }),
    body: {
      content: {
        'application/json': {
          schema: source.pick({ name: true, isReadabilitified: true }),
        },
      },
      required: true,
      description: '',
    },
  },
  responses: {
    200: {
      content: { 'application/json': { schema: source } },
      description: '',
    },
  },
})

export const handler = createHandler(route, async (context) => {
  const params = context.req.valid('param')
  const json = context.req.valid('json')

  const [existingSource] = await db
    .select()
    .from(tables.sources)
    .where(eq(tables.sources.id, params.id))
    .limit(1)

  if (!existingSource) {
    throw new HTTPException(404)
  }

  const [updatedSource] = await db
    .update(tables.sources)
    .set({
      ...existingSource,
      name: json.name,
      isReadabilitified: json.isReadabilitified,
    })
    .where(eq(tables.sources.id, existingSource.id))
    .returning()

  return context.json(updatedSource, 200)
})
