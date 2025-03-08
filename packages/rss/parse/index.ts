import { parser } from '../common'
import {
  deEntity,
  retrieveAuthors,
  retrieveImage,
  retrieveItems,
  retrievePublishedAt,
  retrieveSelf,
  retrieveUpdatedAt,
} from './functions'
import { parsedRss } from './schemas'
import type { ParsedRss } from './types'

export type Options = {
  extraFeedFields?: Array<string>
  extraItemFields?: Array<string>
}

export type Parse = (xml: string | Buffer, options?: Options) => ParsedRss

export const parse: Parse = (xml) => {
  const object = parser.parse(xml).rss

  const output: ParsedRss = {
    authors: retrieveAuthors(object?.channel),
    // TODO: Add categories.
    // TODO: Add hub.
    copyright: deEntity(object?.channel?.copyright?.['#text']),
    description: deEntity(object?.channel?.description?.['#text']),
    generator: deEntity(object?.channel?.generator?.['#text']),
    image: retrieveImage(object?.channel),
    items: retrieveItems(object?.channel),
    language: deEntity(object?.channel?.language?.['#text']),
    link: deEntity(object?.channel?.link?.['#text']),
    publishedAt: retrievePublishedAt(object?.channel),
    self: retrieveSelf(object?.channel),
    title: deEntity(object?.channel?.title?.['#text']),
    updatedAt: retrieveUpdatedAt(object?.channel),
    version: deEntity(object?.version),
  }

  // TODO: Implement:
  // - Ability to define and parse specified extra root/item attributes.

  return parsedRss.parse(output)
}
