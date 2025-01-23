import { jsonFeedContentTypes } from '../../constants/parsers'
import { isOneOfContentTypes } from '../../helpers/finders'
import { parseJsonFeedChannel, parseJsonFeedItems } from '../../helpers/parsers'
import { FeedParser } from '../../types/system'

export const jsonFeed: FeedParser = async (response, url) => {
    if (!isOneOfContentTypes(response, jsonFeedContentTypes)) {
        return
    }

    // TODO: Validate if the JSON file is actually a JSON Feed.
    const feed = await response.json()

    return {
        channel: parseJsonFeedChannel(feed, url),
        items: parseJsonFeedItems(feed),
    }
}
