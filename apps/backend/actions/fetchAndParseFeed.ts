import { HTTPException } from 'hono/http-exception'
import {
    mapJsonFeedToNewChannel,
    mapJsonFeedToNewItems,
    mapXmlFeedToNewChannel,
    mapXmlFeedToNewItems,
} from '../helpers/feeds'
import { rssParser } from '../instances/rssParser'
import { NewChannel, NewItem } from '../types/schemas'

const xmlContentTypes = [
    'application/atom+xml',
    'application/rss+xml',
    'application/xml',
    'text/xml',
]

type FetchAndParseFeed = (url: string) => Promise<{
    channel: NewChannel
    items: Array<NewItem>
}>

// TODO: To optimize the function use cases, add options parameter that will give control whether
// to return channel/items or not. This could be useful in fetchAndDiscoverFeeds action where we
// only need the Channel details and do not care about Items.
export const fetchAndParseFeed: FetchAndParseFeed = async (url) => {
    // TODO: Enable caching of requests based on headers in the response.
    const response = await fetch(url)
    const contentType = response.headers.get('content-type')

    if (contentType?.includes('application/json')) {
        // TODO: Validate if the JSON file is actually a JSON Feed.
        const feed = await response.json()

        return {
            channel: mapJsonFeedToNewChannel(feed),
            items: mapJsonFeedToNewItems(feed),
        }
    }

    if (contentType && xmlContentTypes.some((type) => contentType.includes(type))) {
        const xml = await response.text()
        const feed = await rssParser.parseString(xml)

        return {
            channel: mapXmlFeedToNewChannel(feed),
            items: mapXmlFeedToNewItems(feed),
        }
    }

    throw new HTTPException(422)
}
