import { hono } from '~/instances/hono'
import { z } from 'zod'
import { fetchAndParseFeed } from '~/actions/fetchAndParseFeed'
import { validate } from '~/helpers/routes'

const jsonSchema = z.object({ url: z.string().url() })

hono.post('/preview', validate('json', jsonSchema), async (context) => {
    // TODO: Check if there's already exsisting Channel with given URL. If so, return it's data
    // instead of fetching feed data directly.

    // TODO: Add support for detecting and displaying a list of all available feeds if the user
    // provides a URL to a website that does not support feeds.

    const json = context.req.valid('json')
    const feed = await fetchAndParseFeed(json.url)

    return context.json(feed)
})
