import { HTTPException } from 'hono/http-exception'
import { jsonFeedContentTypes, xmlFeedContentTypes } from '../constants/scrapers'
import {
    mapJsonFeedToFeedChannel,
    mapJsonFeedToFeedItems,
    mapXmlFeedToFeedChannel,
    mapXmlFeedToFeedItems,
} from '../helpers/feeds'
import { isOneOfContentTypes } from '../helpers/scrapers'
import { rssParser } from '../instances/rssParser'
import { FeedData } from '../types/schemas'

type ParseFeed = (response: Response) => Promise<FeedData>

// TODO: To optimize the function use cases, add options parameter that will give control whether
// to return channel/items or not. This could be useful in fetchAndDiscoverFeeds action where we
// only need the Channel details and do not care about Items.
export const parseFeed: ParseFeed = async (response) => {
    if (isOneOfContentTypes(response, jsonFeedContentTypes)) {
        // TODO: Validate if the JSON file is actually a JSON Feed.
        const feed = await response.json()

        return {
            channel: mapJsonFeedToFeedChannel(feed),
            items: mapJsonFeedToFeedItems(feed),
        }
    }

    if (isOneOfContentTypes(response, xmlFeedContentTypes)) {
        const xml = await response.text()
        const feed = await rssParser.parseString(xml)

        return {
            channel: mapXmlFeedToFeedChannel(feed),
            items: mapXmlFeedToFeedItems(feed),
        }
    }

    throw new HTTPException(422)
}
