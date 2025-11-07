import type { Atom, DeepPartial } from 'feedsmith/types'
import { dateCustomFormat } from '../parsers/dateCustomFormat.ts'
import { dateStandard } from '../parsers/dateStandard.ts'
import type { FeedChannel, FeedItem, RawFeedChannel, RawFeedItem } from '../types/schemas.ts'
import { generateChecksum } from './hashes.ts'
import { parseValue } from './parsers.ts'

export const retrieveAlternateLink = (links?: Array<DeepPartial<Atom.Link<string>>>) => {
  return links?.find((link) => (!link.rel || link.rel === 'alternate') && link.href)?.href
}

export const retrieveSelfLink = (links?: Array<DeepPartial<Atom.Link<string>>>) => {
  return links?.find((link) => link.rel === 'self' && link.href)?.href
}

export const parseRawFeedChannel = (rawChannel: RawFeedChannel): FeedChannel => {
  return {
    title: rawChannel.title,
    description: rawChannel.description,
    siteUrl: rawChannel.siteUrl,
    selfUrl: rawChannel.selfUrl,
  }
}

export const parseRawFeedItems = <I>(
  items: Array<I>,
  composeRawItem: (item: I) => RawFeedItem,
): Array<FeedItem> => {
  const parsedItems: Array<FeedItem> = []
  const uniqueChecksums: Set<string> = new Set()

  for (const item of items) {
    const rawItem = composeRawItem(item)

    const link = rawItem.link || ''
    const guid = rawItem.guid || link
    const publishedAt = parseValue(
      rawItem.publishedAt,
      [dateStandard, dateCustomFormat],
      new Date(),
    )

    const itemHash = generateChecksum(guid, link, rawItem.publishedAt)
    const contentHash = generateChecksum(rawItem.content)
    const combinedChecksum = [itemHash, contentHash].join(':')

    if (uniqueChecksums.has(combinedChecksum)) {
      continue
    }

    const parsedItem = {
      link,
      guid,
      title: rawItem.title,
      description: rawItem.description,
      author: rawItem.author,
      content: rawItem.content,
      itemHash,
      contentHash,
      publishedAt,
      rawPublishedAt: rawItem.publishedAt,
    }

    parsedItems.push(parsedItem)
    uniqueChecksums.add(combinedChecksum)
  }

  return parsedItems
}
