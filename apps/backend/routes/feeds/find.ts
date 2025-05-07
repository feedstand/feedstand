import { createRoute, z } from '@hono/zod-openapi'
import { findFeeds } from '../../actions/findFeeds.ts'
import { createHandler } from '../../helpers/hono.ts'
import { foundFeeds } from '../../schemas/foundFeeds.ts'

export const route = createRoute({
  method: 'post',
  path: '/feeds/find',
  request: {
    body: {
      content: { 'application/json': { schema: z.object({ url: z.string().url() }) } },
      required: true,
      description: '',
    },
  },
  responses: {
    200: {
      content: { 'application/json': { schema: foundFeeds.shape.feeds } },
      description: '',
    },
  },
})

export const handler = createHandler(route, async (context) => {
  const { url } = context.req.valid('json')
  const { feeds } = await findFeeds({ url })

  return context.json(feeds, 200)
})
