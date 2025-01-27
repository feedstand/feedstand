import { castArray, get } from 'lodash-es'
import { jsonFeedContentTypes } from '../../constants/parsers'
import { parseValue, trimStrings } from '../../helpers/parsers'
import { isOneOfContentTypes } from '../../helpers/responses'
import { JsonFeed } from '../../types/feeds'
import { FeedChannel, FeedItem } from '../../types/schemas'
import { FeedParser } from '../../types/system'
import { dateAi } from '../values/dateAi'
import { dateCustomFormat } from '../values/dateCustomFormat'
import { dateStandard } from '../values/dateStandard'
import { textStandard } from '../values/textStandard'

export const jsonFeedChannel = (feed: JsonFeed, url: string): FeedChannel => {
    return trimStrings({
        url: parseValue(feed.feed_url, [textStandard], url),
        title: parseValue(feed.title, [textStandard]),
        link: parseValue(feed.home_page_url, [textStandard]),
        description: parseValue(feed.description, [textStandard]),
    })
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

        const parsedLink = parseValue(item.url, [textStandard], '')

        items.push(
            trimStrings({
                link: parsedLink,
                guid: parseValue(item.id, [textStandard], parsedLink),
                title: parseValue(item.title, [textStandard]),
                description: parseValue(item.summary, [textStandard]),
                author: parseValue(get(item.authors, '0.name'), [textStandard]),
                content: parseValue(item.content_html || item.content_text, [textStandard]),
                publishedAt: parseValue(
                    item.date_published,
                    [dateStandard, dateCustomFormat, dateAi],
                    new Date(),
                ),
            }),
        )
    }

    return items
}

export const jsonFeed: FeedParser = async (response) => {
    if (!isOneOfContentTypes(response, jsonFeedContentTypes)) {
        return
    }

    // TODO: Validate if the JSON file is actually a JSON Feed.
    const feed = await response.json()

    return {
        channel: jsonFeedChannel(feed, response.url),
        items: jsonFeedItems(feed),
    }
}
