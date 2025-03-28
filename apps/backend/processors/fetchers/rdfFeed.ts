import { type RdfFeed, parseRdfFeed } from 'feedsmith'
import type { FetchFeedProcessor } from '../../actions/fetchFeed'
import { parseRawFeedChannel, parseRawFeedItems } from '../../helpers/feeds'
import type { FeedChannel, FeedItem } from '../../types/schemas'

export const rdfFeedChannel = (feed: RdfFeed): FeedChannel => {
  return parseRawFeedChannel({
    title: feed.title,
    description: feed.description,
    siteUrl: feed.link,
    selfUrl: feed.atom?.links?.find((link) => link.rel === 'self')?.href,
  })
}

export const rdfFeedItems = (feed: RdfFeed): Array<FeedItem> => {
  if (!feed.items?.length) {
    return []
  }

  return parseRawFeedItems(feed.items, (item) => ({
    link: item.link,
    guid: item.link,
    title: item.title,
    description: item.description || item.atom?.summary || item.dc?.description,
    author: item.atom?.authors?.[0]?.name || item.dc?.creator,
    content: item.content?.encoded,
    publishedAt: item.atom?.published || item.dc?.date,
  }))
}

export const rdfFeed: FetchFeedProcessor = async (context, next) => {
  if (!context.response?.ok || context.result) {
    return await next()
  }

  try {
    const xml = await context.response.text()
    const feed = parseRdfFeed(xml)

    context.result = {
      meta: {
        etag: context.response.headers.get('etag'),
        hash: context.response.hash,
        type: 'rdf',
        requestUrl: context.url,
        responseUrl: context.response.url,
      },
      channel: rdfFeedChannel(feed),
      items: rdfFeedItems(feed),
    }
  } catch (error) {
    context.error = error
  }

  await next()
}
