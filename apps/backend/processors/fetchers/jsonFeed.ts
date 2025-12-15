import { detectJsonFeed, parseJsonFeed } from 'feedsmith'
import type { DeepPartial, Json } from 'feedsmith/types'
import { createFeedProcessor, parseRawFeedChannel, parseRawFeedItems } from '../../helpers/feeds.ts'
import type { FeedChannel, FeedItem } from '../../types/schemas.ts'

export const jsonFeedChannel = (feed: DeepPartial<Json.Feed<string>>): FeedChannel => {
  return parseRawFeedChannel({
    title: feed.title,
    description: feed.description,
    siteUrl: feed.home_page_url,
    selfUrl: feed.feed_url,
  })
}

export const jsonFeedItems = (feed: DeepPartial<Json.Feed<string>>): Array<FeedItem> => {
  if (!feed.items?.length) {
    return []
  }

  return parseRawFeedItems(feed.items, (item) => ({
    link: item.url,
    guid: item.id,
    title: item.title,
    description: item.summary,
    author: item.authors?.[0]?.name,
    content: item.content_html || item.content_text,
    publishedAt: item.date_published || item.date_modified,
  }))
}

export const jsonFeed = createFeedProcessor({
  type: 'json',
  getContent: (response) => response.json(),
  detect: detectJsonFeed,
  parse: parseJsonFeed,
  parseChannel: jsonFeedChannel,
  parseItems: jsonFeedItems,
})
