import { ParsedFeed as ParsedJsonFeed, parse as parseJsonFeed } from '@feedstand/jsonfeed'
import { castArray, get } from 'lodash-es'
import { FetchFeedProcessor } from '../../actions/fetchFeed'
import { parseRawFeedChannel, parseRawFeedItems } from '../../helpers/feeds'
import { FeedChannel, FeedItem } from '../../types/schemas'

export const jsonFeedChannel = (feed: ParsedJsonFeed): FeedChannel => {
  return parseRawFeedChannel({
    title: feed.title,
    description: feed.description,
    siteUrl: feed.home_page_url,
    selfUrl: feed.feed_url,
  })
}

export const jsonFeedItems = (feed: ParsedJsonFeed): Array<FeedItem> => {
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

  const json = await context.response.json()

  if (!json) {
    return await next()
  }

  try {
    const out = parseJsonFeed(json)
    const channel = jsonFeedChannel(out)
    const items = jsonFeedItems(out)

    context.result = {
      meta: {
        etag: context.response.headers.get('etag'),
        hash: context.response.hash,
        type: 'json',
        requestUrl: context.url,
        responseUrl: context.response.url,
      },
      channel,
      items,
    }
  } catch (error) {
    context.error = error
  }

  await next()
}
