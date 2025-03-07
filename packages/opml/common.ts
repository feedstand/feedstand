import { XMLParser } from 'fast-xml-parser'

export const parser = new XMLParser({
  ignoreAttributes: false,
  attributeNamePrefix: '',
  parseTagValue: false,
  parseAttributeValue: false,
  isArray: (name) => name === 'outlines',
  transformTagName: (name) => (name === 'outline' ? 'outlines' : name),
})
