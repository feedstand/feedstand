import { castArray, get } from 'lodash-es'
import { FetchFeedProcessor } from '../../actions/fetchFeed'
import { parseValue, trimStrings } from '../../helpers/parsers'
import { dateAi } from '../../parsers/dateAi'
import { dateCustomFormat } from '../../parsers/dateCustomFormat'
import { dateStandard } from '../../parsers/dateStandard'
import { textStandard } from '../../parsers/textStandard'
import { JsonFeed } from '../../types/feeds'
import { FeedChannel, FeedItem } from '../../types/schemas'

export const jsonFeedChannel = (feed: JsonFeed, url: string): FeedChannel => {
    return trimStrings({
        title: parseValue(feed.title, [textStandard]),
        description: parseValue(feed.description, [textStandard]),
        siteUrl: parseValue(feed.home_page_url, [textStandard]),
        feedUrl: parseValue(feed.feed_url, [textStandard], url),
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

export const jsonFeed: FetchFeedProcessor = async (context, next) => {
    if (!context.response?.ok) {
        return await next()
    }

    // TODO: Should content type check be skipped? In the real world, feeds do not always set the
    // correct content type indicating XML which result in some feeds not being correctly scanned.
    // if !isOneOfContentTypes(response, jsonFeedContentTypes)) {
    //     return await next()
    // }

    try {
        // TODO: Validate if the JSON file is actually a JSON Feed.
        const out = await context.response?.clone().json()

        context.result = {
            etag: context.response.headers.get('etag'),
            type: 'json',
            channel: jsonFeedChannel(out, context.response.url),
            items: jsonFeedItems(out),
        }
    } catch (error) {
        context.error = error
    }

    await next()
}
