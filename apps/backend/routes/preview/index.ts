import { createRoute, z } from '@hono/zod-openapi'
import { createInsertSchema } from 'drizzle-zod'
import { fetchAndParseFeed } from '~/actions/fetchAndParseFeed'
import { tables } from '~/database/tables'
import { hono } from '~/instances/hono'

const route = createRoute({
    method: 'post',
    path: '/preview',
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
                        channel: createInsertSchema(tables.channels),
                        items: z.array(createInsertSchema(tables.items)),
                    }),
                },
            },
            description: '',
        },
    },
    tags: ['Feeds'],
})

hono.openapi(route, async (context) => {
    // TODO: Check if there's already exsisting Channel with given URL. If so, return it's data
    // instead of fetching feed data directly.

    // TODO: Add support for detecting and displaying a list of all available feeds if the user
    // provides a URL to a website that does not support feeds.

    const json = context.req.valid('json')
    const feed = await fetchAndParseFeed(json.url)

    return context.json(feed, 200)
})
