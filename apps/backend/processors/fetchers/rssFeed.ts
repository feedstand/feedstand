import { type RssFeed, parseRssFeed } from 'feedsmith'
import type { FetchFeedProcessor } from '../../actions/fetchFeed'
import { parseRawFeedChannel, parseRawFeedItems } from '../../helpers/feeds'
import type { FeedChannel, FeedItem } from '../../types/schemas'

export const rssFeedChannel = (feed: RssFeed): FeedChannel => {
  return parseRawFeedChannel({
    title: feed.title,
    description: feed.description,
    siteUrl: feed.link,
    selfUrl: feed.atom?.links?.find((link) => link.rel === 'self')?.href,
  })
}

export const rssFeedItems = (feed: RssFeed): Array<FeedItem> => {
  if (!feed.items?.length) {
    return []
  }

  return parseRawFeedItems(feed.items, (item) => ({
    link: item.link,
    guid: item.guid,
    title: item.title,
    description: item.description || item.atom?.summary || item.dc?.description,
    author: item.authors?.[0] || item.atom?.authors?.[0]?.name || item.dc?.creator,
    content: item.content?.encoded,
    publishedAt: item.pubDate || item.atom?.published || item.dc?.date,
  }))
}

export const rssFeed: FetchFeedProcessor = async (context, next) => {
  if (!context.response?.ok || context.result) {
    return await next()
  }

  try {
    const xml = await context.response.text()
    const feed = parseRssFeed(xml)

    context.result = {
      meta: {
        etag: context.response.headers.get('etag'),
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
