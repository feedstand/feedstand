import { createHash } from 'node:crypto'
import type { AtomFeed } from 'feedsmith'
import { dateCustomFormat } from '../parsers/dateCustomFormat.ts'
import { dateStandard } from '../parsers/dateStandard.ts'
import { linkFromAtom } from '../parsers/linkFromAtom.ts'
import { textStandard } from '../parsers/textStandard.ts'
import type { FeedChannel, FeedItem, RawFeedChannel, RawFeedItem } from '../types/schemas.ts'
import { parseValue, trimStrings } from './parsers.ts'

export const generateChecksum = (...values: Array<string | null | undefined>) => {
  return createHash('md5').update(values.join('')).digest('hex')
}

export const retreiveAlternateLink = (links: AtomFeed['links']) => {
  return links?.find((link) => (!link.rel || link.rel === 'alternate') && link.href)?.href
}

export const retreiveSelfLink = (links: AtomFeed['links']) => {
  return links?.find((link) => link.rel === 'self' && link.href)?.href
}

export const parseRawFeedChannel = (rawChannel: RawFeedChannel): FeedChannel => {
  return trimStrings({
    title: parseValue(rawChannel.title, [textStandard]),
    description: parseValue(rawChannel.description, [textStandard]),
    siteUrl: parseValue(rawChannel.siteUrl, [textStandard, linkFromAtom]),
    selfUrl: parseValue(rawChannel.selfUrl, [textStandard, linkFromAtom]),
  })
}

export const parseRawFeedItems = <I>(
  items: Array<I>,
  composeRawItem: (item: I) => RawFeedItem,
): Array<FeedItem> => {
  const parsedItems: Array<FeedItem> = []
  const uniqueChecksums: Set<string> = new Set()

  for (const item of items) {
    const rawItem = composeRawItem(item)

    const parsedLink = parseValue(rawItem.link, [textStandard], '')
    const parsedGuid = parseValue(rawItem.guid, [textStandard], parsedLink)
    const parsedPublishedAt = parseValue(
      rawItem.publishedAt,
      [dateStandard, dateCustomFormat],
      new Date(),
    )
    const parsedContent = parseValue(rawItem.content, [textStandard])

    const itemHash = generateChecksum(parsedGuid, parsedLink, rawItem.publishedAt)
    const contentHash = generateChecksum(parsedContent)
    const combinedChecksum = [itemHash, contentHash].join(':')

    if (uniqueChecksums.has(combinedChecksum)) {
      continue
    }

    const parsedItem = trimStrings({
      link: parsedLink,
      guid: parsedGuid,
      title: parseValue(rawItem.title, [textStandard]),
      description: parseValue(rawItem.description, [textStandard]),
      author: parseValue(rawItem.author, [textStandard]),
      content: parsedContent,
      itemHash,
      contentHash,
      publishedAt: parsedPublishedAt,
      rawPublishedAt: rawItem.publishedAt,
    })

    parsedItems.push(parsedItem)
    uniqueChecksums.add(combinedChecksum)
  }

  return parsedItems
}
