import { castArray, get } from 'lodash-es'
import { dayjs } from '../instances/dayjs'
import { JsonFeed, XmlFeed } from '../types/feeds'
import { FeedChannel, FeedItem } from '../types/schemas'

export const mapJsonFeedToFeedChannel = (feed: JsonFeed): FeedChannel => {
    return {
        url: feed.feed_url ?? '',
        title: feed.title ?? '',
        link: feed.home_page_url ?? '',
        description: feed.description,
    }
}

export const mapJsonFeedToFeedItems = (feed: JsonFeed): Array<FeedItem> => {
    return castArray(feed.items).map((item) => ({
        title: item.title ?? '',
        link: item.url ?? '',
        description: item.summary,
        author: get(item.authors, '0.name'),
        guid: item.id ?? '',
        content: item.content_html ?? item.content_text ?? '',
        publishedAt: dayjs(item.date_published).toDate(),
    }))
}

export const mapXmlFeedToFeedChannel = (feed: XmlFeed): FeedChannel => {
    return {
        url: feed.feedUrl ?? '',
        title: feed.title ?? '',
        link: feed.link ?? '',
        description: feed.description,
    }
}

export const mapXmlFeedToFeedItems = (feed: XmlFeed): Array<FeedItem> => {
    return feed.items.map((item) => ({
        title: item.title ?? '',
        link: item.link ?? '',
        description: item.summary,
        author: item.author,
        guid: (item.guid || item.id) ?? '',
        content: item.content ?? '',
        publishedAt: dayjs(item.pubDate).toDate(),
    }))
}
