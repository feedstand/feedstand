import { castArray, get } from 'lodash-es'
import { authorFromAtom } from '../parsers/authorFromAtom'
import { dateAi } from '../parsers/dateAi'
import { dateCustomFormat } from '../parsers/dateCustomFormat'
import { dateStandard } from '../parsers/dateStandard'
import { linkFromAtom } from '../parsers/linkFromAtom'
import { textStandard } from '../parsers/textStandard'
import { JsonFeed, XmlFeed } from '../types/feeds'
import { FeedChannel, FeedItem } from '../types/schemas'

export const parseValue = <
    T,
    V,
    P extends (value: V) => T | undefined,
    F extends T | undefined = undefined,
>(
    value: V,
    parsers: Array<P>,
    fallback?: F,
): F extends undefined ? ReturnType<P> : NonNullable<ReturnType<P>> => {
    for (const parser of parsers) {
        const parsedValue = parser(value)

        if (parsedValue !== undefined) {
            return parsedValue as NonNullable<ReturnType<P>>
        }
    }

    return fallback as NonNullable<ReturnType<P>>
}

export const trimStrings = <T extends Record<string, unknown>>(data: T): T => {
    return Object.fromEntries(
        Object.entries(data).map(([key, value]) => [
            key,
            typeof value === 'string' ? value.trim() : value,
        ]),
    ) as T
}

export const parseJsonFeedChannel = (feed: JsonFeed, url: string): FeedChannel => {
    return {
        url: feed.feed_url || url,
        title: feed.title,
        link: feed.home_page_url,
        description: feed.description,
    }
}

export const parseJsonFeedItems = (feed: JsonFeed): Array<FeedItem> => {
    return castArray(feed.items)
        .filter((item) => item.url)
        .map((item) => {
            return {
                title: item.title,
                link: item.url,
                description: item.summary,
                author: get(item.authors, '0.name'),
                guid: item.id || item.url,
                content: item.content_html || item.content_text,
                publishedAt: item.date_published,
            }
        })
}

export const parseXmlFeedChannel = (feed: XmlFeed, url: string): FeedChannel => {
    return trimStrings({
        url: parseValue(feed.feedUrl, [textStandard], url),
        title: parseValue(feed.title, [textStandard]),
        link: parseValue(feed.link, [textStandard, linkFromAtom]),
        description: parseValue(feed.description, [textStandard]),
    })
}

export const parseXmlFeedItems = (feed: XmlFeed): Array<FeedItem> => {
    return feed.items
        .filter((item) => item.link)
        .map((item) => {
            const link = parseValue(item.link, [textStandard], '')

            return trimStrings({
                link,
                guid: parseValue(item.guid, [textStandard], link),
                title: parseValue(item.title, [textStandard]),
                description: parseValue(item.summary, [textStandard]),
                author: parseValue(item.creator, [textStandard, authorFromAtom]),
                content: parseValue(item.content, [textStandard]),
                publishedAt: parseValue(
                    item.pubDate,
                    [dateStandard, dateCustomFormat, dateAi],
                    new Date(),
                ),
            })
        })
}
