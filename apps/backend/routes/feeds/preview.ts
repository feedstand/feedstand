import { createRoute, z } from '@hono/zod-openapi'
import { fetchFeed } from '../../actions/fetchFeed.js'
import { createHandler } from '../../helpers/hono.js'
import { feedData } from '../../schemas/feedData.js'

export const route = createRoute({
  method: 'post',
  path: '/feeds/preview',
  request: {
    body: {
      content: { 'application/json': { schema: z.object({ url: z.string().url() }) } },
      required: true,
      description: '',
    },
  },
  responses: {
    200: {
      content: { 'application/json': { schema: feedData } },
      description: '',
    },
  },
})

export const handler = createHandler(route, async (context) => {
  // TODO: Check if there's already exsisting Channel with given URL. If so, return it's data
  // instead of fetching feed data directly.

  // TODO: Only preview 20? latest posts. Example of very long feed: https://olagist.net/feed/.

  const { url } = context.req.valid('json')
  const feedData = await fetchFeed({ url })

  return context.json(feedData, 200)
})
