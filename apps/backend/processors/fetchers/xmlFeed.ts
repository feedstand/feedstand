import RSSParser from 'rss-parser'
import { FetchFeedProcessor } from '../../actions/fetchFeed'
import { parseFeedItems } from '../../helpers/feeds'
import { parseValue, trimStrings } from '../../helpers/parsers'
import { linkFromAtom } from '../../parsers/linkFromAtom'
import { textStandard } from '../../parsers/textStandard'
import { XmlFeed } from '../../types/feeds'
import { FeedChannel, FeedItem } from '../../types/schemas'

export const xmlFeedChannel = (feed: XmlFeed, url: string): FeedChannel => {
    return trimStrings({
        title: parseValue(feed.title, [textStandard]),
        description: parseValue(feed.description, [textStandard]),
        siteUrl: parseValue(feed.link, [textStandard, linkFromAtom]),
        // TODO: Consider using feed.feedUrl. The only problem is that it might be a relative
        // URL instead of absolute. What to do in such cases?
        // url: parseValue(feed.feedUrl, [textStandard], url),
        feedUrl: url,
    })
}

export const xmlFeedItems = (feed: XmlFeed): Array<FeedItem> => {
    if (!feed.items?.length) {
        return []
    }

    return parseFeedItems(feed.items, (item) => ({
        link: item.link,
        guid: item.guid,
        title: item.title,
        description: item.summary,
        author: item.creator,
        content: item.content,
        publishedAt: item.isoDate,
    }))
}

export const xmlFeed: FetchFeedProcessor = async (context, next) => {
    if (!context.response?.ok || context.result) {
        return await next()
    }

    // TODO: Should content type check be skipped? In the real world, feeds do not always set the
    // correct content type indicating XML which result in some feeds not being correctly scanned.
    // if (!isOneOfContentTypes(response, xmlFeedContentTypes)) {
    //     return await next()
    // }

    try {
        const xml = await context.response.text()
        // TODO: Return early if XML is not actually an XML?
        const out = await new RSSParser().parseString(xml)

        context.result = {
            etag: context.response.headers.get('etag'),
            type: 'xml',
            channel: xmlFeedChannel(out, context.response.url),
            items: xmlFeedItems(out),
        }
    } catch (error) {
        context.error = error
    }

    await next()
}
