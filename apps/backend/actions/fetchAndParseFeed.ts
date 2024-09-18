import { NewChannel, NewItem } from '~/types/database.js'
import { rssParser } from '~/instances/rssParser.js'
import {
    mapJsonFeedToNewChannel,
    mapJsonFeedToNewItems,
    mapXmlFeedToNewChannel,
    mapXmlFeedToNewItems,
} from '~/helpers/feeds.js'

const xmlContentTypes = [
    'application/atom+xml',
    'application/rss+xml',
    'application/xml',
    'text/xml',
]

export const fetchAndParseFeed = async (
    url: string,
): Promise<{ channel: NewChannel; items: Array<NewItem> }> => {
    // TODO: Enable caching of requests based on headers in the response.
    const response = await fetch(url)
    const contentType = response.headers.get('Content-Type')

    if (contentType?.includes('application/json')) {
        // TODO: Validate if the JSON file is actually a JSON Feed.
        const feed = await response.json()

        return {
            channel: mapJsonFeedToNewChannel(feed),
            items: mapJsonFeedToNewItems(feed),
        }
    }

    if (contentType && xmlContentTypes.some((xmlType) => contentType.includes(xmlType))) {
        const xml = await response.text()
        const feed = await rssParser.parseString(xml)

        return {
            channel: mapXmlFeedToNewChannel(feed),
            items: mapXmlFeedToNewItems(feed),
        }
    }

    // TODO: Implement custom error class and handling them in Fastify.
    throw new Error()
}
