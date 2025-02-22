import { createRoute, z } from '@hono/zod-openapi'
import { desc, eq } from 'drizzle-orm'
import { HTTPException } from 'hono/http-exception'
import { tables } from '../../database/tables'
import { createHandler } from '../../helpers/hono'
import { db } from '../../instances/database'
import { item } from '../../schemas/item'

export const route = createRoute({
  method: 'get',
  path: '/channels/{id}/items',
  request: {
    params: z.object({ id: z.coerce.number() }),
  },
  responses: {
    200: {
      content: { 'application/json': { schema: z.array(item) } },
      description: 'Show all Items belonging to a specific Channel.',
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

  const items = await db
    .select()
    .from(tables.items)
    .where(eq(tables.items.channelId, channel.id))
    .orderBy(desc(tables.items.publishedAt))

  return context.json(items, 200)
})
