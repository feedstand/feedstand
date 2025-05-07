import { createRoute, z } from '@hono/zod-openapi'
import { eq } from 'drizzle-orm'
import { HTTPException } from 'hono/http-exception'
import { tables } from '../../database/tables.ts'
import { createHandler } from '../../helpers/hono.ts'
import { db } from '../../instances/database.ts'
import { source } from '../../schemas/source.ts'

export const route = createRoute({
  method: 'get',
  path: '/sources/{id}',
  request: {
    params: z.object({ id: z.coerce.number() }),
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

  const [source] = await db
    .select()
    .from(tables.sources)
    .where(eq(tables.sources.id, params.id))
    .limit(1)

  if (!source) {
    throw new HTTPException(404)
  }

  return context.json(source, 200)
})
