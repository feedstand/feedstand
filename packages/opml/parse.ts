import { Parser } from 'htmlparser2'
import type { LooseOpml, LooseOpmlOutline } from './types'

export const convertXmlToJson = (xml: string): LooseOpml => {
  const json: LooseOpml = {
    version: '',
    head: {},
    body: { outline: [] },
  }

  const outlineStack: Array<LooseOpmlOutline> = []

  let currentElement: string | null = null
  let currentText = ''

  const parser = new Parser(
    {
      onopentag(name, attributes) {
        switch (name) {
          case 'opml':
            json.version = attributes.version
            break

          case 'outline': {
            const outline: LooseOpmlOutline = { ...attributes }

            if (outlineStack.length > 0) {
              const parentOutline = outlineStack[outlineStack.length - 1]
              parentOutline.outline = parentOutline.outline || []
              parentOutline.outline.push(outline)
            } else {
              json.body.outline.push(outline)
            }

            outlineStack.push(outline)
            break
          }

          case 'title':
          case 'dateCreated':
          case 'dateModified':
          case 'ownerName':
          case 'ownerEmail':
          case 'ownerId':
          case 'docs':
          case 'expansionState':
          case 'vertScrollState':
          case 'windowTop':
          case 'windowLeft':
          case 'windowBottom':
          case 'windowRight':
            currentElement = name
            currentText = ''
            break
        }
      },

      ontext(text) {
        if (currentElement) {
          currentText += text.trim()
        }
      },

      onclosetag(name) {
        if (name === 'outline') {
          outlineStack.pop()
          return
        }

        if (name === currentElement) {
          json.head[currentElement] = currentText
          currentElement = null
          currentText = ''
        }
      },
    },
    {
      xmlMode: true,
      decodeEntities: true,
    },
  )

  parser.write(xml)
  parser.end()

  return json
}

export type ParseOpmlOptions = {
  strict?: boolean
  downloadExternalOutlines?: boolean
}

// TODO: Add support for parsing streams/files.
export type ParseOpml = (opml: string, options?: ParseOpmlOptions) => LooseOpml

export const parseOpml: ParseOpml = (xml) => {
  // TODO: Add option to validate if options.strict, etc.
  // TODO: Implement casting LooseOpml object to StrictOpml if flag is enabled.
  return convertXmlToJson(xml)
}
