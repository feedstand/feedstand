import { describe, expect, it } from 'vitest'
import { getFirstPropValue, retrievePublishedAt, retrieveSelf } from './functions'

describe('getFirstPropValue', () => {
  it('should return undefined for null input', () => {
    expect(getFirstPropValue(null, ['prop'])).toBeUndefined()
  })

  it('should return undefined for undefined input', () => {
    expect(getFirstPropValue(undefined, ['prop'])).toBeUndefined()
  })

  it('should return undefined for string input', () => {
    expect(getFirstPropValue('string', ['prop'])).toBeUndefined()
  })

  it('should return undefined for numeric input', () => {
    expect(getFirstPropValue(123, ['prop'])).toBeUndefined()
  })

  it('should return undefined for boolean input', () => {
    expect(getFirstPropValue(true, ['prop'])).toBeUndefined()
  })

  it('should return the value of the first matching property (case-sensitive)', () => {
    const record = {
      first: 'value1',
      second: 'value2',
      third: 'value3',
    }

    expect(getFirstPropValue(record, ['first'])).toBe('value1')
    expect(getFirstPropValue(record, ['second', 'first'])).toBe('value2')
    expect(getFirstPropValue(record, ['fourth', 'third'])).toBe('value3')
    expect(getFirstPropValue(record, ['fourth', 'fifth'])).toBeUndefined()
  })

  it('should handle case-insensitive matching when exact match not found', () => {
    const record = {
      FIRST: 'value1',
      Second: 'value2',
      tHiRd: 'value3',
    }

    expect(getFirstPropValue(record, ['first'])).toBe('value1')
    expect(getFirstPropValue(record, ['second'])).toBe('value2')
    expect(getFirstPropValue(record, ['third'])).toBe('value3')
  })

  it('should respect the priority order for case-insensitive matches', () => {
    const record = {
      FIRST: 'value1',
      SECOND: 'value2',
      THIRD: 'value3',
    }

    expect(getFirstPropValue(record, ['third', 'second', 'first'])).toBe('value3')
    expect(getFirstPropValue(record, ['second', 'first', 'third'])).toBe('value2')
    expect(getFirstPropValue(record, ['first', 'third', 'second'])).toBe('value1')
  })

  it('should handle mixed case properties correctly', () => {
    const record = {
      'atom:UPDATED': '2023-01-01',
      'DC:date': '2022-12-31',
      'pubDate': '2023-01-15',
    }

    expect(getFirstPropValue(record, ['atom:updated', 'dc:date'])).toBe('2023-01-01')
    expect(getFirstPropValue(record, ['dc:date', 'atom:updated'])).toBe('2022-12-31')
    expect(getFirstPropValue(record, ['pubdate', 'dc:date'])).toBe('2023-01-15')
  })

  it('should handle empty arrays of properties', () => {
    const record = { prop: 'value' }

    expect(getFirstPropValue(record, [])).toBeUndefined()
  })

  it('should handle properties with falsy values', () => {
    const record = {
      zero: 0,
      empty: '',
      falseVal: false,
      nullVal: null,
    }

    expect(getFirstPropValue(record, ['zero'])).toBe(0)
    expect(getFirstPropValue(record, ['empty'])).toBe('')
    expect(getFirstPropValue(record, ['falseVal'])).toBe(false)
    expect(getFirstPropValue(record, ['nullVal'])).toBe(null)
  })

  it('should handle undefined values correctly', () => {
    const record = {
      defined: 'value',
      undef: undefined,
    }

    expect(getFirstPropValue(record, ['undef'])).toBeUndefined()
    expect(getFirstPropValue(record, ['missing', 'defined'])).toBe('value')
  })

  it('should work with array-like objects', () => {
    const arrayLike = { 0: 'zero', 1: 'one', 2: 'two', length: 3 }

    expect(getFirstPropValue(arrayLike, ['0'])).toBe('zero')
    expect(getFirstPropValue(arrayLike, ['length'])).toBe(3)
  })

  it('should handle complex nested objects', () => {
    const record = {
      'user': { name: 'John', age: 30 },
      'user:info': { role: 'admin' },
    }

    expect(getFirstPropValue(record, ['user'])).toEqual({ name: 'John', age: 30 })
    expect(getFirstPropValue(record, ['USER:INFO', 'user'])).toEqual({ role: 'admin' })
  })

  it('should handle feed-like objects with namespaced properties', () => {
    const item = {
      'ATOM:published': '2023-01-01T12:00:00Z',
      'dc:date': '2022-12-31T00:00:00Z',
      'pubDate': 'Sat, 31 Dec 2022 12:00:00 GMT',
    }

    expect(getFirstPropValue(item, ['published', 'atom:published', 'dc:date', 'pubDate'])).toBe(
      '2023-01-01T12:00:00Z',
    )
    expect(getFirstPropValue(item, ['published', 'pubDate', 'dc:date', 'atom:published'])).toBe(
      'Sat, 31 Dec 2022 12:00:00 GMT',
    )
  })
})

describe('retrieveSelf', () => {
  it('should return the href of the first atom:link with rel="self"', () => {
    const xml = {
      'atom:link': [
        {
          href: 'https://hub.com',
          rel: 'hub',
          type: 'application/rss+xml',
        },
        {
          href: 'https://domain1.com/feed',
          rel: 'self',
          type: 'application/rss+xml',
        },
        {
          href: 'http://domain2.com/feed',
          rel: 'self',
          type: 'application/rss+xml',
        },
      ],
    }

    const result = retrieveSelf(xml)
    expect(result).toBe('https://domain1.com/feed')
  })

  it('should handle atom:link with missing href attribute', () => {
    const xml = {
      'atom:link': [
        {
          rel: 'self',
          type: 'application/rss+xml',
        },
      ],
    }

    const result = retrieveSelf(xml)
    expect(result).toBeUndefined()
  })

  it('should return undefined when atom:link has null href attribute', () => {
    const xml = {
      'atom:link': [
        {
          href: null,
          rel: 'self',
          type: 'application/rss+xml',
        },
      ],
    }

    const result = retrieveSelf(xml)
    expect(result).toBeUndefined()
  })

  it('should return empty string when atom:link has empty string href attribute', () => {
    const xml = {
      'atom:link': [
        {
          href: '',
          rel: 'self',
          type: 'application/rss+xml',
        },
      ],
    }

    const result = retrieveSelf(xml)
    expect(result).toEqual('')
  })

  it('should return undefined if no atom:link with rel="self" exists', () => {
    const xml = {
      'atom:link': [
        {
          href: 'https://hub.kurwa',
          rel: 'hub',
          type: 'application/rss+xml',
        },
        {
          href: 'https://feeds.libsyn.com/20818/rss',
          rel: 'alternate',
          type: 'application/rss+xml',
        },
      ],
    }

    const result = retrieveSelf(xml)
    expect(result).toBeUndefined()
  })

  it('should return undefined if atom:link array is empty', () => {
    const xml = {
      'atom:link': [],
    }

    const result = retrieveSelf(xml)
    expect(result).toBeUndefined()
  })

  it('should return undefined if atom:link is not an array', () => {
    const xml = {
      'atom:link': {
        href: 'https://feeds.libsyn.com/20818/rss',
        rel: 'self',
        type: 'application/rss+xml',
      },
    }

    const result = retrieveSelf(xml)
    expect(result).toBeUndefined()
  })

  it('should return undefined if channel is missing', () => {
    const xml = {
      title: 'My Feed',
    }

    const result = retrieveSelf(xml)
    expect(result).toBeUndefined()
  })

  it('should return undefined if input is null', () => {
    const result = retrieveSelf(null)
    expect(result).toBeUndefined()
  })

  it('should return undefined if input is undefined', () => {
    const result = retrieveSelf(undefined)
    expect(result).toBeUndefined()
  })

  it('should return undefined if input is a string', () => {
    const result = retrieveSelf('not an object')
    expect(result).toBeUndefined()
  })

  it('should return undefined if input is a number', () => {
    const result = retrieveSelf(42)
    expect(result).toBeUndefined()
  })

  it('should return undefined if input is an array', () => {
    const result = retrieveSelf([1, 2, 3])
    expect(result).toBeUndefined()
  })
})

describe('retrievePublishedAt', () => {
  it('should retrieve RSS pubDate', () => {
    const item = {
      title: 'Test Item',
      pubDate: 'Wed, 15 Apr 2023 14:30:00 GMT',
    }

    expect(retrievePublishedAt(item)).toBe('Wed, 15 Apr 2023 14:30:00 GMT')
  })

  it('should retrieve Atom published', () => {
    const item = {
      title: 'Test Item',
      published: '2023-04-15T14:30:00Z',
    }

    expect(retrievePublishedAt(item)).toBe('2023-04-15T14:30:00Z')
  })

  it('should retrieve namespaced Atom published', () => {
    const item = {
      'title': 'Test Item',
      'atom:published': '2023-04-15T14:30:00Z',
    }

    expect(retrievePublishedAt(item)).toBe('2023-04-15T14:30:00Z')
  })

  it('should retrieve alternative Atom namespace published', () => {
    const item = {
      'title': 'Test Item',
      'a10:published': '2023-04-15T14:30:00Z',
    }

    expect(retrievePublishedAt(item)).toBe('2023-04-15T14:30:00Z')
  })

  it('should retrieve Atom 0.3 issued', () => {
    const item = {
      title: 'Test Item',
      issued: '2023-04-15T14:30:00Z',
    }

    expect(retrievePublishedAt(item)).toBe('2023-04-15T14:30:00Z')
  })

  it('should retrieve namespaced Atom 0.3 issued', () => {
    const item = {
      'title': 'Test Item',
      'atom:issued': '2023-04-15T14:30:00Z',
    }

    expect(retrievePublishedAt(item)).toBe('2023-04-15T14:30:00Z')
  })

  it('should retrieve Dublin Core created', () => {
    const item = {
      'title': 'Test Item',
      'dc:created': '2023-04-15T14:30:00Z',
    }

    expect(retrievePublishedAt(item)).toBe('2023-04-15T14:30:00Z')
  })

  it('should retrieve Dublin Core Terms created', () => {
    const item = {
      'title': 'Test Item',
      'dcterms:created': '2023-04-15T14:30:00Z',
    }

    expect(retrievePublishedAt(item)).toBe('2023-04-15T14:30:00Z')
  })

  it('should retrieve Dublin Core Terms issued', () => {
    const item = {
      'title': 'Test Item',
      'dcterms:issued': '2023-04-15T14:30:00Z',
    }

    expect(retrievePublishedAt(item)).toBe('2023-04-15T14:30:00Z')
  })

  it('should retrieve Media RSS pubDate', () => {
    const item = {
      'title': 'Test Item',
      'media:pubDate': '2023-04-15T14:30:00Z',
    }

    expect(retrievePublishedAt(item)).toBe('2023-04-15T14:30:00Z')
  })

  it('should retrieve iTunes pubDate', () => {
    const item = {
      'title': 'Test Item',
      'itunes:pubDate': '2023-04-15T14:30:00Z',
    }

    expect(retrievePublishedAt(item)).toBe('2023-04-15T14:30:00Z')
  })

  it('should handle case-insensitive property names', () => {
    const item = {
      title: 'Test Item',
      PUBDATE: '2023-04-15T14:30:00Z',
    }

    expect(retrievePublishedAt(item)).toBe('2023-04-15T14:30:00Z')
  })

  it('should respect priority order when multiple date properties exist', () => {
    const item = {
      'title': 'Test Item',
      'pubDate': 'Wed, 15 Apr 2023 14:30:00 GMT',
      'published': '2023-04-14T12:00:00Z',
      'dc:date': '2023-04-13T10:00:00Z',
    }

    expect(retrievePublishedAt(item)).toBe('Wed, 15 Apr 2023 14:30:00 GMT')
  })

  it('should respect priority order with case-insensitive matching', () => {
    const item = {
      'title': 'Test Item',
      'PUBLISHED': '2023-04-14T12:00:00Z',
      'DC:DATE': '2023-04-13T10:00:00Z',
    }

    expect(retrievePublishedAt(item)).toBe('2023-04-14T12:00:00Z')
  })

  it('should handle mixed case in namespaced properties', () => {
    const item = {
      'title': 'Test Item',
      'ATOM:PUBLISHED': '2023-04-15T14:30:00Z',
    }

    expect(retrievePublishedAt(item)).toBe('2023-04-15T14:30:00Z')
  })

  it('should handle complex feed item structure', () => {
    const item = {
      'title': 'Test Article',
      'link': 'https://example.com/article',
      'description': 'This is a test article',
      'atom:published': '2023-04-15T14:30:00Z',
      'dc:creator': 'John Doe',
      'categories': ['test', 'example'],
    }

    expect(retrievePublishedAt(item)).toBe('2023-04-15T14:30:00Z')
  })

  it('should not find published date in nested object', () => {
    const item = {
      title: 'Test Item',
      content: {
        pubDate: 'Wed, 15 Apr 2023 14:30:00 GMT',
      },
    }

    expect(retrievePublishedAt(item)).toBeUndefined()
  })

  it('should return undefined when no published date is found', () => {
    const item = {
      title: 'Test Item',
      description: 'Test Description',
    }

    expect(retrievePublishedAt(item)).toBeUndefined()
  })

  it('should return undefined for null input', () => {
    expect(retrievePublishedAt(null)).toBeUndefined()
  })

  it('should return undefined for undefined input', () => {
    expect(retrievePublishedAt(undefined)).toBeUndefined()
  })

  it('should return undefined for string input', () => {
    expect(retrievePublishedAt('string')).toBeUndefined()
  })

  it('should return undefined for number input', () => {
    expect(retrievePublishedAt(123)).toBeUndefined()
  })

  it('should return undefined for boolean input', () => {
    expect(retrievePublishedAt(true)).toBeUndefined()
  })
})
