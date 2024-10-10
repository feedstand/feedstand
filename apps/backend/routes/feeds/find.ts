import { createRoute, z } from '@hono/zod-openapi'
import { fetchPageOrFeed } from '../../actions/fetchPageOrFeed'
import { findFeeds } from '../../actions/findFeeds'
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
    const { url } = context.req.valid('json')
    const pageOrFeed = await fetchPageOrFeed(url)
    const feeds = await findFeeds(pageOrFeed, url)

    return context.json(feeds, 200)
})
