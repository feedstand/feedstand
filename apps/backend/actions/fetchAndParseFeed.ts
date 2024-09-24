import { NewChannel, NewItem } from '~/types/database'
import { rssParser } from '~/instances/rssParser'
import {
    mapJsonFeedToNewChannel,
    mapJsonFeedToNewItems,
    mapXmlFeedToNewChannel,
    mapXmlFeedToNewItems,
} from '~/helpers/feeds'
import { HTTPException } from 'hono/http-exception'

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

export const fetchAndParseFeed: FetchAndParseFeed = async (url) => {
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

    throw new HTTPException(422)
}
