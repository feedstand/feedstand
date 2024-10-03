import { createRoute, z } from '@hono/zod-openapi'
import { fetchAndFindFeeds } from '../../actions/fetchAndFindFeeds'
import { createHandler } from '../../helpers/hono'
import { feedInfo } from '../../schemas/feedInfo'

export const route = createRoute({
    method: 'post',
    path: '/feeds/find',
    request: {
        body: {
            content: { 'application/json': { schema: z.object({ url: z.string().url() }) } },
            description: '',
        },
    },
    responses: {
        200: {
            content: { 'application/json': { schema: z.array(feedInfo) } },
            description: '',
        },
    },
})

export const handler = createHandler(route, async (context) => {
    const json = context.req.valid('json')
    const feeds = await fetchAndFindFeeds(json.url)

    return context.json(feeds, 200)
})
