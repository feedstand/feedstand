import { createRoute, z } from '@hono/zod-openapi'
import { eq } from 'drizzle-orm'
import { HTTPException } from 'hono/http-exception'
import { tables } from '../../database/tables.ts'
import { createHandler } from '../../helpers/hono.ts'
import { db } from '../../instances/database.ts'
import { channel } from '../../schemas/channel.ts'

export const route = createRoute({
  method: 'get',
  path: '/channels/{id}',
  request: {
    params: z.object({ id: z.coerce.number() }),
  },
  responses: {
    200: {
      content: { 'application/json': { schema: channel } },
      description: '',
    },
  },
})

export const handler = createHandler(route, async (context) => {
  const params = context.req.valid('param')

  const [channel] = await db
    .select()
    .from(tables.channels)
    .where(eq(tables.channels.id, params.id))
    .limit(1)

  if (!channel) {
    throw new HTTPException(404)
  }

  return context.json(channel)
})
