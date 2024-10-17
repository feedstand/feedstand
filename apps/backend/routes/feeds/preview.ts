import { createRoute, z } from '@hono/zod-openapi'
import { fetchExternalUrl } from '../../actions/fetchExternalUrl'
import { parseFeed } from '../../actions/parseFeed'
import { createHandler } from '../../helpers/hono'
import { feedData } from '../../schemas/feedData'

export const route = createRoute({
    method: 'post',
    path: '/feeds/preview',
    request: {
        body: {
            content: { 'application/json': { schema: z.object({ url: z.string().url() }) } },
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

    const { url } = context.req.valid('json')
    const response = await fetchExternalUrl(url)
    const feedData = await parseFeed(response, url)

    return context.json(feedData, 200)
})
