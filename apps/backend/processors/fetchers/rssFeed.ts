import { detectRssFeed, parseRssFeed } from 'feedsmith'
import type { DeepPartial, Rss } from 'feedsmith/types'
import type { FetchFeedProcessor } from '../../actions/fetchFeed.ts'
import {
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
      description: item.description || item.atom?.summary || item.dc?.description,
      author: item.authors?.[0] || item.atom?.authors?.[0]?.name || item.dc?.creator,
      content: item.content?.encoded,
      publishedAt: item.pubDate || item.atom?.published || item.dc?.date || item.atom?.updated,
    }
  })
}

export const rssFeed: FetchFeedProcessor = async (context, next) => {
  if (!context.response?.ok || context.result) {
    return await next()
  }

  try {
    const xml = await context.response.text()

    if (!detectRssFeed(xml)) {
      return await next()
    }

    const feed = parseRssFeed(xml)

    context.result = {
      meta: {
        etag: context.response.headers.get('etag'),
        lastModified: context.response.headers.get('last-modified'),
        contentBytes: context.response.contentBytes,
        hash: context.response.hash,
        type: 'rss',
        requestUrl: context.url,
        responseUrl: context.response.url,
      },
      channel: rssFeedChannel(feed),
      items: rssFeedItems(feed),
    }
  } catch (error) {
    context.error = error
  }

  await next()
}
