import { parseRdfFeed } from 'feedsmith'
import type { DeepPartial, Rdf } from 'feedsmith/types'
import type { FetchFeedProcessor } from '../../actions/fetchFeed.ts'
import {
  parseRawFeedChannel,
  parseRawFeedItems,
  retrieveAlternateLink,
  retrieveSelfLink,
} from '../../helpers/feeds.ts'
import type { FeedChannel, FeedItem } from '../../types/schemas.ts'

export const rdfFeedChannel = (feed: DeepPartial<Rdf.Feed<string>>): FeedChannel => {
  return parseRawFeedChannel({
    title: feed.title,
    description: feed.description,
    siteUrl: feed.link || retrieveAlternateLink(feed.atom?.links),
    selfUrl: retrieveSelfLink(feed.atom?.links),
  })
}

export const rdfFeedItems = (feed: DeepPartial<Rdf.Feed<string>>): Array<FeedItem> => {
  if (!feed.items?.length) {
    return []
  }

  return parseRawFeedItems(feed.items, (item) => {
    const link = item.link || retrieveAlternateLink(item.atom?.links)

    return {
      link,
      guid: link,
      title: item.title,
      description: item.description || item.atom?.summary || item.dc?.description,
      author: item.atom?.authors?.[0]?.name || item.dc?.creator,
      content: item.content?.encoded,
      publishedAt: item.atom?.published || item.dc?.date || item.atom?.updated,
    }
  })
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
