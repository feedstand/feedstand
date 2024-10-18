import { castArray, get } from 'lodash-es'
import { authorFromAtom } from '../parsers/authorFromAtom'
import { dateExtendedTimezone } from '../parsers/dateExtendedTimeZone'
import { dateMidnightTime } from '../parsers/dateMidnightTime'
import { dateStandard } from '../parsers/dateStandard'
import { linkFromAtom } from '../parsers/linkFromAtom'
import { textStandard } from '../parsers/textStandard'
import { JsonFeed, XmlFeed } from '../types/feeds'
import { FeedChannel, FeedItem } from '../types/schemas'

export const parseValue = <
    T,
    V = unknown,
    F extends T | undefined = undefined,
    R = F extends T ? T : T | undefined,
>(
    value: V,
    parsers: Array<(value: V) => T | undefined>,
    fallback?: F,
): R => {
    for (const parser of parsers) {
        const parsedValue = parser(value)

        if (parsedValue !== undefined) {
            return parsedValue as R
        }
    }

    return fallback as R
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
        title: feed.title ?? '',
        link: feed.home_page_url ?? '',
        description: feed.description,
    }
}

export const parseJsonFeedItems = (feed: JsonFeed): Array<FeedItem> => {
    return castArray(feed.items)
        .filter((item) => item.url)
        .map((item) => {
            return {
                title: item.title ?? '',
                link: item.url ?? '',
                description: item.summary,
                author: get(item.authors, '0.name'),
                guid: item.id ?? item.url, // TODO: Is there a better way?
                content: item.content_html ?? item.content_text ?? '',
                publishedAt: item.date_published,
            }
        })
}

export const parseXmlFeedChannel = (feed: XmlFeed, url: string): FeedChannel => {
    return trimStrings({
        url: parseValue(feed.feedUrl, [textStandard], url),
        title: parseValue(feed.title, [textStandard], ''),
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
                    [dateStandard, dateExtendedTimezone, dateMidnightTime],
                    new Date(),
                ),
            })
        })
}
