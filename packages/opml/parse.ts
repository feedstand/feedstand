import { XMLParser } from 'fast-xml-parser'
import type { ParsedOpml } from './types'
import { parsedOpml } from './schemas/parse'

const parser = new XMLParser({
  ignoreAttributes: false,
  attributeNamePrefix: '',
  parseTagValue: false,
  parseAttributeValue: false,
  isArray: (name) => name === 'outline',
})

export type Options = {
  downloadExternalOutlines?: boolean
  extraOutlineAttributes?: Array<string>
}

export type Parse = (xml: string, options?: Options) => ParsedOpml

export const parse: Parse = (xml: string): ParsedOpml => {
  const input = parser.parse(xml).opml
  const output = parsedOpml.parse(input)

  // TODO: Implement:
  // - Ability to download external outlines when enabled.
  // - Ability to define and parse specified additional outline attributes.

  return output
}
