import { castArray, get } from 'lodash-es'
import { jsonFeedContentTypes } from '../../constants/parsers'
import { trimStrings } from '../../helpers/parsers'
import { isOneOfContentTypes } from '../../helpers/responses'
import { JsonFeed } from '../../types/feeds'
import { FeedChannel, FeedItem } from '../../types/schemas'
import { FeedParser } from '../../types/system'

export const jsonFeedChannel = (feed: JsonFeed, url: string): FeedChannel => {
    return {
        url: feed.feed_url || url,
        title: feed.title,
        link: feed.home_page_url,
        description: feed.description,
    }
}

export const jsonFeedItems = (feed: JsonFeed): Array<FeedItem> => {
    if (!feed.items?.length) {
        return []
    }

    const items: Array<FeedItem> = []

    for (const item of castArray(feed.items)) {
        if (!item.url) {
            continue
        }

        items.push(
            trimStrings({
                title: item.title,
                link: item.url,
                description: item.summary,
                author: get(item.authors, '0.name'),
                guid: item.id || item.url,
                content: item.content_html || item.content_text,
                publishedAt: item.date_published,
            }),
        )
    }

    return items
}

export const jsonFeed: FeedParser = async (response, url) => {
    if (!isOneOfContentTypes(response, jsonFeedContentTypes)) {
        return
    }

    // TODO: Validate if the JSON file is actually a JSON Feed.
    const feed = await response.json()

    return {
        channel: jsonFeedChannel(feed, url),
        items: jsonFeedItems(feed),
    }
}
