import { createRoute, z } from '@hono/zod-openapi'
import { fetchPageOrFeed } from '../../actions/fetchPageOrFeed'
import { parseFeed } from '../../actions/parseFeed'
import { createHandler } from '../../helpers/hono'
import { feedItem } from '../../schemas/feedItem'
import { newChannel } from '../../schemas/newChannel'

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
            content: {
                'application/json': {
                    schema: z.object({
                        channel: newChannel,
                        items: z.array(feedItem),
                    }),
                },
            },
            description: '',
        },
    },
})

export const handler = createHandler(route, async (context) => {
    // TODO: Check if there's already exsisting Channel with given URL. If so, return it's data
    // instead of fetching feed data directly.

    const { url } = context.req.valid('json')
    const pageOrFeed = await fetchPageOrFeed(url)
    const feed = await parseFeed(pageOrFeed)

    return context.json(feed, 200)
})
