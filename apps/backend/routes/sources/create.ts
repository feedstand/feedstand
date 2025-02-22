import { createRoute, z } from '@hono/zod-openapi'
import { fetchOrCreateChannel } from '../../actions/fetchOrCreateChannel'
import { tables } from '../../database/tables'
import { createHandler } from '../../helpers/hono'
import { db } from '../../instances/database'
import { newSource } from '../../schemas/newSource'
import { source } from '../../schemas/source'

export const route = createRoute({
  method: 'post',
  path: '/sources',
  request: {
    body: {
      content: {
        'application/json': {
          schema: newSource.omit({ channelId: true }).extend({ url: z.string().url() }),
        },
      },
      required: true,
      description: '',
    },
  },
  responses: {
    201: {
      content: { 'application/json': { schema: source } },
      description: '',
    },
  },
})

export const handler = createHandler(route, async (context) => {
  const json = context.req.valid('json')

  const channel = await fetchOrCreateChannel(json.url)

  const [source] = await db
    .insert(tables.sources)
    .values({ ...json, channelId: channel.id })
    .returning()

  return context.json(source, 201)
})
