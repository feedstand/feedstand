import { XMLParser } from 'fast-xml-parser'
import type { LooseOpml, LooseOpmlOutline } from './types'

const HEAD_ELEMENTS = Object.freeze([
  'title',
  'dateCreated',
  'dateModified',
  'ownerName',
  'ownerEmail',
  'ownerId',
  'docs',
  'expansionState',
  'vertScrollState',
  'windowTop',
  'windowLeft',
  'windowBottom',
  'windowRight',
])

const parser = new XMLParser({
  ignoreAttributes: false,
  attributeNamePrefix: '',
  parseTagValue: false,
  isArray: (name) => name === 'outline',
})

const processOutlines = (outlines: Array<any>): Array<LooseOpmlOutline> => {
  return outlines.map(({ outline, ...rest }) => {
    return outline ? { ...rest, outline: processOutlines(outline) } : rest
  })
}

export const convertXmlToJson = (xml: string): LooseOpml => {
  const { opml } = parser.parse(xml) ?? {}

  const json: LooseOpml = {
    version: '',
    head: {},
    body: {
      outline: [],
    },
  }

  if (opml?.version) {
    json.version = opml.version
  }

  if (opml?.head) {
    for (let element of HEAD_ELEMENTS) {
      if (element in opml.head) {
        json.head[element] = opml.head[element]
      }
    }
  }

  if (opml?.body?.outline) {
    json.body.outline = processOutlines(opml.body.outline)
  }

  return json
}

// export type Options = {
//   strict?: boolean
//   downloadExternalOutlines?: boolean
// }

// export const parse = (xml: string, options?: Options): LooseOpml => {
//   if (options?.strict) {
//     const validationResult = XMLValidator.validate(xml)

//     if (validationResult !== true) {
//       throw new Error(`Invalid XML: ${validationResult.err.msg}`)
//     }
//   }

//   return convertXmlToJson(result)
// }
