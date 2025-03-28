import { type JsonFeed, parseJsonFeed } from 'feedsmith'
import { castArray, get } from 'lodash-es'
import type { FetchFeedProcessor } from '../../actions/fetchFeed'
import { parseRawFeedChannel, parseRawFeedItems } from '../../helpers/feeds'
import type { FeedChannel, FeedItem } from '../../types/schemas'

export const jsonFeedChannel = (feed: JsonFeed): FeedChannel => {
  return parseRawFeedChannel({
    title: feed.title,
    description: feed.description,
    siteUrl: feed.home_page_url,
    selfUrl: feed.feed_url,
  })
}

export const jsonFeedItems = (feed: JsonFeed): Array<FeedItem> => {
  if (!feed.items?.length) {
    return []
  }

  return parseRawFeedItems(castArray(feed.items), (item: any) => ({
    link: item.url,
    guid: item.id,
    title: item.title,
    description: item.summary,
    author: get(item.authors, '0.name'),
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
    const out = parseJsonFeed(json)

    context.result = {
      meta: {
        etag: context.response.headers.get('etag'),
        hash: context.response.hash,
        type: 'json',
        requestUrl: context.url,
        responseUrl: context.response.url,
      },
      channel: jsonFeedChannel(out),
      items: jsonFeedItems(out),
    }
  } catch (error) {
    context.error = error
  }

  await next()
}
