import { ParsedRss as ParsedRssFeed, parse as parseRssFeed } from '@feedstand/rss'
import { FetchFeedProcessor } from '../../actions/fetchFeed'
import { parseRawFeedChannel, parseRawFeedItems } from '../../helpers/feeds'
import { isJson } from '../../helpers/strings'
import { FeedChannel, FeedItem } from '../../types/schemas'

export const xmlFeedChannel = (feed: ParsedRssFeed): FeedChannel => {
  return parseRawFeedChannel({
    title: feed.title,
    description: feed.description,
    siteUrl: feed.link,
    selfUrl: feed.self,
  })
}

export const xmlFeedItems = (feed: ParsedRssFeed): Array<FeedItem> => {
  if (!feed.items?.length) {
    return []
  }

  return parseRawFeedItems(feed.items, (item) => ({
    link: item.link,
    guid: item.id,
    title: item.title,
    description: item.description,
    author: item.authors?.[0]?.name,
    content: item.content,
    publishedAt: item.publishedAt,
  }))
}

export const xmlFeed: FetchFeedProcessor = async (context, next) => {
  if (!context.response?.ok || context.result) {
    return await next()
  }

  try {
    const xml = await context.response.text()

    if (isJson(xml)) {
      return
    }

    const out = parseRssFeed(xml)

    context.result = {
      meta: {
        etag: context.response.headers.get('etag'),
        hash: context.response.hash,
        type: 'xml',
        requestUrl: context.url,
        responseUrl: context.response.url,
      },
      channel: xmlFeedChannel(out),
      items: xmlFeedItems(out),
    }
  } catch (error) {
    context.error = error
  }

  await next()
}
