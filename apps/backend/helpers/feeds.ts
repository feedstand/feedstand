import type { Atom, DeepPartial } from 'feedsmith/types'
import type { FetchUrlOptions, FetchUrlResponse } from '../actions/fetchUrl.ts'
import { resolveDate } from '../actions/resolveDate.ts'
import type {
  ChannelType,
  FeedChannel,
  FeedData,
  FeedItem,
  RawFeedChannel,
  RawFeedItem,
} from '../types/schemas.ts'
import { generateChecksum } from './hashes.ts'
import type { WorkflowProcessor } from './workflows.ts'

export type FeedProcessorOptions<F> = {
  type: ChannelType
  getContent: (response: FetchUrlResponse) => Promise<unknown>
  detect: (content: unknown) => boolean
  parse: (content: unknown) => F
  parseChannel: (feed: F) => FeedChannel
  parseItems: (feed: F) => Array<FeedItem>
}

export const createFeedProcessor = <F>(
  options: FeedProcessorOptions<F>,
): WorkflowProcessor<FeedData, FetchUrlOptions> => {
  return async (context, next) => {
    if (!context.response?.ok || context.result) {
      return await next()
    }

    try {
      const content = await options.getContent(context.response)

      if (!options.detect(content)) {
        return await next()
      }

      const feed = options.parse(content)

      context.result = {
        meta: {
          etag: context.response.headers.get('etag'),
          lastModified: context.response.headers.get('last-modified'),
          contentBytes: context.response.contentBytes,
          hash: context.response.hash,
          type: options.type,
          requestUrl: context.url,
          responseUrl: context.response.url,
        },
        channel: options.parseChannel(feed),
        items: options.parseItems(feed),
      }
    } catch (error) {
      context.error = error
    }

    await next()
  }
}

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
    const publishedAt = resolveDate(rawItem.publishedAt) || new Date()

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
