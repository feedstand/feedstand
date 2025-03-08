import { XMLParser } from 'fast-xml-parser'

export const parser = new XMLParser({
  alwaysCreateTextNode: true,
  ignoreAttributes: false,
  attributeNamePrefix: '',
  parseTagValue: false,
  parseAttributeValue: false,
  isArray: (name) => ['item', 'category', 'author', 'itunes:author', 'atom:link'].includes(name),
})
