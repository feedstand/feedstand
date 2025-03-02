import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { describe, it, expect } from 'vitest'
import { parse } from './parse'
import categoryJson from './fixtures/category.json'
import countriesJson from './fixtures/countries.json'
import directoryJson from './fixtures/directory.json'
import placesJson from './fixtures/places.json'
import scriptJson from './fixtures/script.json'
import subscriptionsJson from './fixtures/subscriptions.json'

const readOpmlFile = (filename: string) => {
  return readFileSync(join(__dirname, 'fixtures', filename), 'utf-8')
}

describe('parse', () => {
  it('should parse category OPML exactly', () => {
    const xml = readOpmlFile('category.opml')
    const result = parse(xml)

    expect(result).toEqual(categoryJson)
  })

  it('should parse directory OPML exactly', () => {
    const xml = readOpmlFile('directory.opml')
    const result = parse(xml)

    expect(result).toEqual(directoryJson)
  })

  it('should parse places OPML exactly', () => {
    const xml = readOpmlFile('places.opml')
    const result = parse(xml)

    expect(result).toEqual(placesJson)
  })

  it('should parse script OPML exactly', () => {
    const xml = readOpmlFile('script.opml')
    const result = parse(xml)

    expect(result).toEqual(scriptJson)
  })

  it('should parse countries OPML exactly', () => {
    const xml = readOpmlFile('countries.opml')
    const result = parse(xml)

    expect(result).toEqual(countriesJson)
  })

  it('should parse subscriptions OPML exactly', () => {
    const xml = readOpmlFile('subscriptions.opml')
    const result = parse(xml)

    expect(result).toEqual(subscriptionsJson)
  })
})

it('should handle empty string', () => {
  const result = parse('')

  expect(result).toBeUndefined()
})
