import { createRoute, z } from '@hono/zod-openapi'
import { fetchFeed } from '../../actions/fetchFeed'
import { findFeeds } from '../../actions/findFeeds'
import { directFinder } from '../../finders/directFinder'
import { webpageFinder } from '../../finders/webpageFinder'
import { youTubeFinder } from '../../finders/youTubeFinder'
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
    const response = await fetchFeed(url)
    const feeds = await findFeeds(response, url, [youTubeFinder, directFinder, webpageFinder])

    return context.json(feeds, 200)
})
