import dayjs from 'dayjs'
import { castArray, get } from 'lodash-es'
import { NewChannel, NewItem } from '../types/database'
import { JsonFeed, XmlFeed } from '../types/feeds'

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
