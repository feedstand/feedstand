import { parsedFeed } from './schemas/parse'
import { ParsedFeed } from './types'

export type Options = {
  extraFeedAttributes?: Array<string>
  extraHeadAttributes?: Array<string>
  extraItemAttributes?: Array<string>
}

export type Parse = (json: Record<string, unknown>, options?: Options) => ParsedFeed

export const parse: Parse = (json) => {
  const result = parsedFeed.parse(json)

  // TODO: Implement:
  // - Ability to define and parse specified additional attributes in feed, head, item.

  return result
}
