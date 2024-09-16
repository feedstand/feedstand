import { app } from '~/instances/server.js'
import { parseRequestToSchema } from '~/helpers/routes.js'
import { z } from 'zod'
import { rssParser } from '~/instances/rssParser.js'
import dayjs from 'dayjs'
import { NewChannel, NewItem } from '~/types/database.js'
import { castArray } from 'lodash-es'

const xmlTypes = ['application/rss+xml', 'application/atom+xml', 'application/xml', 'text/xml']

app.post('/preview', async (request, reply) => {
    const schema = z.object({ body: z.object({ url: z.string().url() }) })
    const { body } = parseRequestToSchema({ request, reply, schema })

    // TODO: Enable caching of requests based on headers in the response.
    const response = await fetch(body.url)
    const contentType = response.headers.get('Content-Type')

    if (contentType?.includes('application/json')) {
        // TODO: Validate if the JSON file is actually a JSON Feed.
        const feed = await response.json()

        const channel: NewChannel = {
            url: feed.feed_url ?? '',
            title: feed.title ?? '',
            link: feed.home_page_url ?? '',
            description: feed.description,
        }

        const items: Array<NewItem> = castArray(feed.items).map((item) => ({
            channelId: Infinity,
            title: item.title ?? '',
            link: item.url ?? '',
            description: item.summary,
            author: castArray(item.authors)[0],
            guid: item.id ?? '',
            content: item.content_html ?? item.content_text ?? '',
            publishedAt: dayjs(item.date_published).toDate(),
        }))

        return reply.send({ channel, items })
    }

    if (contentType && xmlTypes.some((xmlType) => contentType.includes(xmlType))) {
        const xml = await response.text()
        const feed = await rssParser.parseString(xml)

        const channel: NewChannel = {
            url: feed.feedUrl ?? '',
            title: feed.title ?? '',
            link: feed.link ?? '',
            description: feed.description,
        }

        const items: Array<NewItem> = feed.items.map((item) => ({
            channelId: Infinity,
            title: item.title ?? '',
            link: item.link ?? '',
            description: item.summary,
            author: item.author,
            guid: item.guid ?? '',
            content: item.content ?? '',
            publishedAt: dayjs(item.pubDate).toDate(),
        }))

        return reply.send({ channel, items })
    }

    return reply.status(400).send()
})
