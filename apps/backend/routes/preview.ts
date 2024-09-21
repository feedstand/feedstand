import { app } from '~/instances/server'
import { parseRequestToSchema } from '~/helpers/routes'
import { z } from 'zod'
import { fetchAndParseFeed } from '~/actions/fetchAndParseFeed'

app.post('/preview', async (request, reply) => {
    const schema = z.object({ body: z.object({ url: z.string().url() }) })
    const { body } = parseRequestToSchema({ request, schema })

    // TODO: Check if there's already exsisting Channel with given URL. If so, return it's data
    // instead of fetching feed data directly.

    // TODO: Add support for detecting and displaying a list of all available feeds if the user
    // provides a URL to a website that does not support feeds.

    const feed = await fetchAndParseFeed(body.url)

    return reply.send(feed)
})
