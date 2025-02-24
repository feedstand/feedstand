import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { describe, it, expect } from 'vitest'
import { convertXmlToJson } from './parse'
import categoryLooseJson from './fixtures/loose/category.json'
import placesLivedLooseJson from './fixtures/loose/placesLived.json'
import directoryLooseJson from './fixtures/loose/directory.json'
import statesLooseJson from './fixtures/loose/states.json'
import simpleScriptLooseJson from './fixtures/loose/simpleScript.json'
import subscriptionListLooseJson from './fixtures/loose/subscriptionList.json'

const readOpmlFile = (filename: string) => {
  return readFileSync(join(__dirname, 'fixtures', 'opmls', filename), 'utf-8')
}

describe('convertXmlToJson', () => {
  it('should parse category OPML exactly', () => {
    const xml = readOpmlFile('category.opml')
    const result = convertXmlToJson(xml)

    expect(result).toEqual(categoryLooseJson)
  })

  it('should parse directory OPML exactly', () => {
    const xml = readOpmlFile('directory.opml')
    const result = convertXmlToJson(xml)

    expect(result).toEqual(directoryLooseJson)
  })

  it('should parse places lived OPML exactly', () => {
    const xml = readOpmlFile('placesLived.opml')
    const result = convertXmlToJson(xml)

    expect(result).toEqual(placesLivedLooseJson)
  })

  it('should parse simple script OPML exactly', () => {
    const xml = readOpmlFile('simpleScript.opml')
    const result = convertXmlToJson(xml)

    expect(result).toEqual(simpleScriptLooseJson)
  })

  it('should parse states OPML exactly', () => {
    const xml = readOpmlFile('states.opml')
    const result = convertXmlToJson(xml)

    expect(result).toEqual(statesLooseJson)
  })

  it('should parse subscription list OPML exactly', () => {
    const xml = readOpmlFile('subscriptionList.opml')
    const result = convertXmlToJson(xml)

    expect(result).toEqual(subscriptionListLooseJson)
  })

  it('should handle empty OPML exactly', () => {
    const result = convertXmlToJson('')

    expect(result).toEqual({
      version: '',
      head: {},
      body: { outline: [] },
    })
  })
})
