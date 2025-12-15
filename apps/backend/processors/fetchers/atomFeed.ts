import { detectAtomFeed, parseAtomFeed } from 'feedsmith'
import type { Atom, DeepPartial } from 'feedsmith/types'
import {
  createFeedProcessor,
  parseRawFeedChannel,
  parseRawFeedItems,
  retrieveAlternateLink,
  retrieveSelfLink,
} from '../../helpers/feeds.ts'
import type { FeedChannel, FeedItem } from '../../types/schemas.ts'

export const atomFeedChannel = (feed: DeepPartial<Atom.Feed<string>>): FeedChannel => {
  return parseRawFeedChannel({
    title: feed.title,
    description: feed.subtitle,
    siteUrl: retrieveAlternateLink(feed.links),
    selfUrl: retrieveSelfLink(feed.links),
  })
}

export const atomFeedItems = (feed: DeepPartial<Atom.Feed<string>>): Array<FeedItem> => {
  if (!feed.entries?.length) {
    return []
  }

  return parseRawFeedItems(feed.entries, (item) => {
    const link = retrieveAlternateLink(item.links)

    return {
      link,
      guid: item.id || link,
      title: item.title,
      description: item.summary || item.dc?.descriptions?.[0],
      author: item.authors?.[0]?.name || item.dc?.creators?.[0],
      content: item.content,
      publishedAt: item.published || item.dc?.dates?.[0] || item.updated,
    }
  })
}

export const atomFeed = createFeedProcessor({
  format: 'atom',
  getContent: (response) => response.text(),
  detect: detectAtomFeed,
  parse: parseAtomFeed,
  parseChannel: atomFeedChannel,
  parseItems: atomFeedItems,
})
