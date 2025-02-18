import { castArray, get } from 'lodash-es'
import { FetchFeedProcessor } from '../../actions/fetchFeed'
import { parseFeedItems } from '../../helpers/feeds'
import { parseValue, trimStrings } from '../../helpers/parsers'
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

    return parseFeedItems(castArray(feed.items), (item: any) => ({
        link: item.url,
        guid: item.id,
        title: item.title,
        description: item.summary,
        author: get(item.authors, '0.name'),
        content: item.content_html || item.content_text,
        publishedAt: item.date_published,
    }))
}

export const jsonFeed: FetchFeedProcessor = async (context, next) => {
    if (!context.response?.ok || context.result) {
        return await next()
    }

    // TODO: Should content type check be skipped? In the real world, feeds do not always set the
    // correct content type indicating XML which result in some feeds not being correctly scanned.
    // if !isOneOfContentTypes(response, jsonFeedContentTypes)) {
    //     return await next()
    // }

    try {
        // TODO: Validate if the JSON file is actually a JSON Feed. A good way would be to use
        // Zod schema and validate the `out` with it.
        const out = await context.response.json()

        if (!out) {
            return await next()
        }

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
