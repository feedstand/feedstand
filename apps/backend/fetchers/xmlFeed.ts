import RSSParser from 'rss-parser'
import { FetchFeedFetcher } from '../actions/fetchFeed'
import { parseValue, trimStrings } from '../helpers/parsers'
import { authorFromAtom } from '../parsers/authorFromAtom'
import { dateAi } from '../parsers/dateAi'
import { dateCustomFormat } from '../parsers/dateCustomFormat'
import { dateStandard } from '../parsers/dateStandard'
import { linkFromAtom } from '../parsers/linkFromAtom'
import { textStandard } from '../parsers/textStandard'
import { XmlFeed } from '../types/feeds'
import { FeedChannel, FeedItem } from '../types/schemas'

export const xmlFeedChannel = (feed: XmlFeed, url: string): FeedChannel => {
    return trimStrings({
        url: parseValue(feed.feedUrl, [textStandard], url),
        title: parseValue(feed.title, [textStandard]),
        link: parseValue(feed.link, [textStandard, linkFromAtom]),
        description: parseValue(feed.description, [textStandard]),
    })
}

export const xmlFeedItems = (feed: XmlFeed): Array<FeedItem> => {
    if (!feed.items?.length) {
        return []
    }

    const items: Array<FeedItem> = []

    for (const item of feed.items) {
        if (!item.link) {
            continue
        }

        const parsedLink = parseValue(item.link, [textStandard], '')

        items.push(
            trimStrings({
                link: parsedLink,
                guid: parseValue(item.guid, [textStandard], parsedLink),
                title: parseValue(item.title, [textStandard]),
                description: parseValue(item.summary, [textStandard]),
                author: parseValue(item.creator, [textStandard, authorFromAtom]),
                content: parseValue(item.content, [textStandard]),
                publishedAt: parseValue(
                    item.pubDate,
                    [dateStandard, dateCustomFormat, dateAi],
                    new Date(),
                ),
            }),
        )
    }

    return items
}

export const xmlFeed: FetchFeedFetcher = async (context, next) => {
    if (!context.response?.ok) {
        return await next()
    }

    const response = context.response?.clone()

    // TODO: Should content type check be skipped? In the real world, feeds do not always set the
    // correct content type indicating XML which result in some feeds not being correctly scanned.
    // if (!isOneOfContentTypes(response, xmlFeedContentTypes)) {
    //     return await next()
    // }

    try {
        const xml = await response.text()
        const out = await new RSSParser().parseString(xml)

        context.feed = {
            channel: xmlFeedChannel(out, response.url),
            items: xmlFeedItems(out),
        }
    } catch (error) {
        context.error = error
    }

    await next()
}
