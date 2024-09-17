import dayjs from 'dayjs'
import { NewChannel, NewItem } from '~/types/database.js'
import { castArray, get } from 'lodash-es'
import { JsonFeed, XmlFeed } from '~/types/feeds.js'
import { rssParser } from '~/instances/rssParser.js'

export const mapJsonFeedToNewChannel = (feed: JsonFeed): NewChannel => {
    return {
        url: feed.feed_url ?? '',
        title: feed.title ?? '',
        link: feed.home_page_url ?? '',
        description: feed.description,
    }
}

export const mapJsonFeedToNewItems = (feed: JsonFeed): Array<NewItem> => {
    return castArray(feed.items).map((item) => ({
        channelId: Infinity,
        title: item.title ?? '',
        link: item.url ?? '',
        description: item.summary,
        author: get(item.authors, '0.name'),
        guid: item.id ?? '',
        content: item.content_html ?? item.content_text ?? '',
        publishedAt: dayjs(item.date_published).toDate(),
    }))
}

export const mapXmlFeedToNewChannel = (feed: XmlFeed): NewChannel => {
    return {
        url: feed.feedUrl ?? '',
        title: feed.title ?? '',
        link: feed.link ?? '',
        description: feed.description,
    }
}

export const mapXmlFeedToNewItems = (feed: XmlFeed): Array<NewItem> => {
    return feed.items.map((item) => ({
        channelId: Infinity,
        title: item.title ?? '',
        link: item.link ?? '',
        description: item.summary,
        author: item.author,
        guid: (item.guid || item.id) ?? '',
        content: item.content ?? '',
        publishedAt: dayjs(item.pubDate).toDate(),
    }))
}

const xmlContentTypes = [
    'application/atom+xml',
    'application/rss+xml',
    'application/xml',
    'text/xml',
]

export const fetchAndParseFeed = async (
    url: string,
): Promise<{ channel: NewChannel; items: Array<NewItem> }> => {
    // TODO: Enable caching of requests based on headers in the response.
    const response = await fetch(url)
    const contentType = response.headers.get('Content-Type')

    if (contentType?.includes('application/json')) {
        // TODO: Validate if the JSON file is actually a JSON Feed.
        const feed = await response.json()

        return {
            channel: mapJsonFeedToNewChannel(feed),
            items: mapJsonFeedToNewItems(feed),
        }
    }

    if (contentType && xmlContentTypes.some((xmlType) => contentType.includes(xmlType))) {
        const xml = await response.text()
        const feed = await rssParser.parseString(xml)

        return {
            channel: mapXmlFeedToNewChannel(feed),
            items: mapXmlFeedToNewItems(feed),
        }
    }

    // TODO: Implement custom error class and handling them in Fastify.
    throw new Error()
}
