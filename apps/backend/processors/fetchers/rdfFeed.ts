import { detectRdfFeed, parseRdfFeed } from 'feedsmith'
import type { DeepPartial, Rdf } from 'feedsmith/types'
import {
  createFeedProcessor,
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
      description: item.description || item.atom?.summary || item.dc?.descriptions?.[0],
      author: item.atom?.authors?.[0]?.name || item.dc?.creators?.[0],
      content: item.content?.encoded,
      publishedAt: item.atom?.published || item.dc?.dates?.[0] || item.atom?.updated,
    }
  })
}

export const rdfFeed = createFeedProcessor({
  type: 'rdf',
  getContent: (response) => response.text(),
  detect: detectRdfFeed,
  parse: parseRdfFeed,
  parseChannel: rdfFeedChannel,
  parseItems: rdfFeedItems,
})
