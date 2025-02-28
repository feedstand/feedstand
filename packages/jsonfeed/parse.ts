import { looseFeed, strictFeed } from './schemas'
import { LooseFeed, StrictFeed } from './types'

type LooseOptions = {
  strict?: false
}

type StrictOptions = {
  strict: true
}

export type Options = LooseOptions | StrictOptions

export type Parse = {
  (json: unknown, options: StrictOptions): StrictFeed
  (json: unknown, options?: LooseOptions): LooseFeed
}

export const parse = ((json: unknown, options: Options = {}): LooseFeed | StrictFeed => {
  const strict = options.strict ?? true
  const schema = strict ? strictFeed : looseFeed
  const result = schema.parse(json)

  return result
}) as Parse
