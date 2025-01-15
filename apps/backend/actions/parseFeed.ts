import { HTTPException } from 'hono/http-exception'
import { jsonFeedContentTypes, xmlFeedContentTypes } from '../constants/parsers'
import { isOneOfContentTypes } from '../helpers/finders'
import {
    parseJsonFeedChannel,
    parseJsonFeedItems,
    parseXmlFeedChannel,
    parseXmlFeedItems,
} from '../helpers/parsers'
import { rssParser } from '../instances/rssParser'
import { FeedData } from '../types/schemas'

// TODO: To optimize the function use cases, add options parameter that will give control whether
// to return channel/items or not. This could be useful in fetchAndDiscoverFeeds action where we
// only need the Channel details and do not care about Items.
export const parseFeed = async (response: Response, url: string): Promise<FeedData> => {
    // TODO: Add support for 404 http code.

    if (isOneOfContentTypes(response, jsonFeedContentTypes)) {
        // TODO: Validate if the JSON file is actually a JSON Feed.
        const feed = await response.json()

        return {
            channel: parseJsonFeedChannel(feed, url),
            items: parseJsonFeedItems(feed),
        }
    }

    if (isOneOfContentTypes(response, xmlFeedContentTypes)) {
        const xml = await response.text()
        const feed = await rssParser.parseString(xml)

        return {
            channel: parseXmlFeedChannel(feed, url),
            items: parseXmlFeedItems(feed),
        }
    }

    throw new HTTPException(422)
}
