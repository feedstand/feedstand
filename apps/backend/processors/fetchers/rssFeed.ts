import { detectRssFeed, parseRssFeed } from 'feedsmith'
import type { DeepPartial, Rss } from 'feedsmith/types'
import {
  createFeedProcessor,
  parseRawFeedChannel,
  parseRawFeedItems,
  retrieveAlternateLink,
  retrieveSelfLink,
} from '../../helpers/feeds.ts'
import type { FeedChannel, FeedItem } from '../../types/schemas.ts'

export const rssFeedChannel = (feed: DeepPartial<Rss.Feed<string>>): FeedChannel => {
  return parseRawFeedChannel({
    title: feed.title,
    description: feed.description,
    siteUrl: feed.link || retrieveAlternateLink(feed.atom?.links),
    selfUrl: retrieveSelfLink(feed.atom?.links),
  })
}

export const rssFeedItems = (feed: DeepPartial<Rss.Feed<string>>): Array<FeedItem> => {
  if (!feed.items?.length) {
    return []
  }

  return parseRawFeedItems(feed.items, (item) => {
    const link = item.link || retrieveAlternateLink(item.atom?.links)

    return {
      link,
      guid: item.guid?.value || link,
      title: item.title,
      description: item.description || item.atom?.summary || item.dc?.descriptions?.[0],
      author: item.authors?.[0] || item.atom?.authors?.[0]?.name || item.dc?.creators?.[0],
      content: item.content?.encoded,
      publishedAt:
        item.pubDate || item.atom?.published || item.dc?.dates?.[0] || item.atom?.updated,
    }
  })
}

export const rssFeed = createFeedProcessor({
  type: 'rss',
  getContent: (response) => response.text(),
  detect: detectRssFeed,
  parse: parseRssFeed,
  parseChannel: rssFeedChannel,
  parseItems: rssFeedItems,
})
