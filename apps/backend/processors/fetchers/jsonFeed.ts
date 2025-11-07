import { detectJsonFeed, parseJsonFeed } from 'feedsmith'
import type { DeepPartial, Json } from 'feedsmith/types'
import type { FetchFeedProcessor } from '../../actions/fetchFeed.ts'
import { parseRawFeedChannel, parseRawFeedItems } from '../../helpers/feeds.ts'
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

export const jsonFeed: FetchFeedProcessor = async (context, next) => {
  if (!context.response?.ok || context.result) {
    return await next()
  }

  try {
    const json = await context.response.json()

    // if (!detectJsonFeed(json)) {
    //   return await next()
    // }

    const feed = parseJsonFeed(json)

    context.result = {
      meta: {
        etag: context.response.headers.get('etag'),
        hash: context.response.hash,
        type: 'json',
        requestUrl: context.url,
        responseUrl: context.response.url,
      },
      channel: jsonFeedChannel(feed),
      items: jsonFeedItems(feed),
    }
  } catch (error) {
    context.error = error
  }

  await next()
}
