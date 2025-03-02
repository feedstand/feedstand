import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { describe, it, expect } from 'vitest'
import { parse } from './parse'
import categoryJson from './fixtures/parse/category.json'
import countriesJson from './fixtures/parse/countries.json'
import directoryJson from './fixtures/parse/directory.json'
import placesJson from './fixtures/parse/places.json'
import scriptJson from './fixtures/parse/script.json'
import subscriptionsJson from './fixtures/parse/subscriptions.json'

const readOpmlFile = (filename: string) => {
  return readFileSync(join(__dirname, 'fixtures', filename), 'utf-8')
}

describe('parse', () => {
  it('should parse category OPML exactly', () => {
    const xml = readOpmlFile('parse/category.opml')
    const result = parse(xml)

    expect(result).toEqual(categoryJson)
  })

  it('should parse directory OPML exactly', () => {
    const xml = readOpmlFile('parse/directory.opml')
    const result = parse(xml)

    expect(result).toEqual(directoryJson)
  })

  it('should parse places OPML exactly', () => {
    const xml = readOpmlFile('parse/places.opml')
    const result = parse(xml)

    expect(result).toEqual(placesJson)
  })

  it('should parse script OPML exactly', () => {
    const xml = readOpmlFile('parse/script.opml')
    const result = parse(xml)

    expect(result).toEqual(scriptJson)
  })

  it('should parse countries OPML exactly', () => {
    const xml = readOpmlFile('parse/countries.opml')
    const result = parse(xml)

    expect(result).toEqual(countriesJson)
  })

  it('should parse subscriptions OPML exactly', () => {
    const xml = readOpmlFile('parse/subscriptions.opml')
    const result = parse(xml)

    expect(result).toEqual(subscriptionsJson)
  })
})

it('should handle empty string', () => {
  const result = parse('')

  expect(result).toBeUndefined()
})
