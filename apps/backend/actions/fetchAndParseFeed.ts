import { HTTPException } from 'hono/http-exception'
import { jsonFeedContentTypes, xmlFeedContentTypes } from '../constants/scrapers'
import {
    mapJsonFeedToNewChannel,
    mapJsonFeedToNewItems,
    mapXmlFeedToNewChannel,
    mapXmlFeedToNewItems,
} from '../helpers/feeds'
import { isOneOfContentTypes } from '../helpers/scrapers'
import { rssParser } from '../instances/rssParser'
import { NewChannel, NewItemNoChannel } from '../types/schemas'

type FetchAndParseFeed = (url: string) => Promise<{
    channel: NewChannel
    items: Array<NewItemNoChannel>
}>

// TODO: To optimize the function use cases, add options parameter that will give control whether
// to return channel/items or not. This could be useful in fetchAndDiscoverFeeds action where we
// only need the Channel details and do not care about Items.
export const fetchAndParseFeed: FetchAndParseFeed = async (feedUrl) => {
    // TODO: Enable caching of requests based on headers in the response.
    const response = await fetch(feedUrl)
    const contentType = response.headers.get('content-type')

    if (isOneOfContentTypes(contentType, jsonFeedContentTypes)) {
        // TODO: Validate if the JSON file is actually a JSON Feed.
        const feed = await response.json()

        return {
            channel: mapJsonFeedToNewChannel(feed),
            items: mapJsonFeedToNewItems(feed),
        }
    }

    if (isOneOfContentTypes(contentType, xmlFeedContentTypes)) {
        const xml = await response.text()
        const feed = await rssParser.parseString(xml)

        return {
            channel: mapXmlFeedToNewChannel(feed),
            items: mapXmlFeedToNewItems(feed),
        }
    }

    throw new HTTPException(422)
}
