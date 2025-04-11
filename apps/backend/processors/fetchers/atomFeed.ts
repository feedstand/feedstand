import { type AtomFeed, parseAtomFeed } from 'feedsmith'
import type { FetchFeedProcessor } from '../../actions/fetchFeed.js'
import {
  parseRawFeedChannel,
  parseRawFeedItems,
  retreiveAlternateLink,
  retreiveSelfLink,
} from '../../helpers/feeds.js'
import type { FeedChannel, FeedItem } from '../../types/schemas.js'

export const atomFeedChannel = (feed: AtomFeed): FeedChannel => {
  return parseRawFeedChannel({
    title: feed.title,
    description: feed.subtitle,
    siteUrl: retreiveAlternateLink(feed.links),
    selfUrl: retreiveSelfLink(feed.links),
  })
}

export const atomFeedItems = (feed: AtomFeed): Array<FeedItem> => {
  if (!feed.entries?.length) {
    return []
  }

  return parseRawFeedItems(feed.entries, (item) => {
    const link = retreiveAlternateLink(item.links)

    return {
      link,
      guid: item.id || link,
      title: item.title,
      description: item.summary || item.dc?.description,
      author: item.authors?.[0]?.name || item.dc?.creator,
      content: item.content,
      publishedAt: item.published || item.dc?.date || item.updated,
    }
  })
}

export const atomFeed: FetchFeedProcessor = async (context, next) => {
  if (!context.response?.ok || context.result) {
    return await next()
  }

  try {
    const xml = await context.response.text()
    const feed = parseAtomFeed(xml)

    context.result = {
      meta: {
        etag: context.response.headers.get('etag'),
        hash: context.response.hash,
        type: 'atom',
        requestUrl: context.url,
        responseUrl: context.response.url,
      },
      channel: atomFeedChannel(feed),
      items: atomFeedItems(feed),
    }
  } catch (error) {
    context.error = error
  }

  await next()
}
