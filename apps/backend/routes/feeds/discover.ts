import { createRoute, z } from '@hono/zod-openapi'
import { fetchAndDiscoverFeeds } from '../../actions/fetchAndDiscoverFeeds'
import { createHandler } from '../../helpers/hono'
import { feed } from '../../schemas/feed'

export const route = createRoute({
    method: 'post',
    path: '/feeds/discover',
    request: {
        body: {
            content: { 'application/json': { schema: z.object({ url: z.string().url() }) } },
            description: '',
        },
    },
    responses: {
        200: {
            content: { 'application/json': { schema: z.array(feed) } },
            description: '',
        },
    },
})

export const handler = createHandler(route, async (context) => {
    const json = context.req.valid('json')
    const feeds = await fetchAndDiscoverFeeds(json.url)

    return context.json(feeds, 200)
})
