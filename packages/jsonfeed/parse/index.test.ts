import { describe, expect, it } from 'vitest'
import { parse } from './index'
import { ParsedFeed } from './types'

describe('parse', () => {
  const validFeedV1 = {
    version: 'https://jsonfeed.org/version/1',
    title: 'My Example Feed',
    home_page_url: 'https://example.com/',
    feed_url: 'https://example.com/feed.json',
    author: {
      name: 'John Doe',
      url: 'https://example.com/johndoe',
    },
    items: [
      {
        id: '1',
        content_html: '<p>Hello world</p>',
        url: 'https://example.com/post/1',
        title: 'First post',
        date_published: '2023-01-01T00:00:00Z',
      },
    ],
    custom_field: 'custom value',
  }

  const validFeedV11 = {
    version: 'https://jsonfeed.org/version/1.1',
    title: 'My Example Feed',
    home_page_url: 'https://example.com/',
    feed_url: 'https://example.com/feed.json',
    authors: [
      {
        name: 'John Doe',
        url: 'https://example.com/johndoe',
      },
    ],
    language: 'en-US',
    items: [
      {
        id: '1',
        content_html: '<p>Hello world</p>',
        url: 'https://example.com/post/1',
        title: 'First post',
        date_published: '2023-01-01T00:00:00Z',
        language: 'en-US',
      },
    ],
    custom_field: 'custom value',
  }

  it('should parse valid JSON Feed v1', () => {
    const result = parse(validFeedV1)

    expect(result).toBeDefined()
    expect(result.version).toBe('https://jsonfeed.org/version/1')
    expect(result.title).toBe('My Example Feed')
    expect(result.items).toHaveLength(1)
    expect(result.items?.[0].id).toBe('1')
    expect(result.items?.[0].content_html).toBe('<p>Hello world</p>')
  })

  it('should parse valid JSON Feed v1.1', () => {
    const result = parse(validFeedV11)

    expect(result).toBeDefined()
    expect(result.version).toBe('https://jsonfeed.org/version/1.1')
    expect(result.title).toBe('My Example Feed')
    expect(result.items).toHaveLength(1)
    expect(result.language).toBe('en-US')
    expect(result.authors).toHaveLength(1)
    expect(result.authors?.[0].name).toBe('John Doe')
  })

  it('should parse feed with invalid URLs', () => {
    const feed = {
      version: 'https://jsonfeed.org/version/1',
      title: 'My Example Feed',
      home_page_url: 'invalid-url',
      items: [
        {
          id: '1',
          content_html: '<p>Hello world</p>',
        },
      ],
    }
    const result = parse(feed)

    expect(result.home_page_url).toBe('invalid-url')
  })

  it('should handle missing optional fields', () => {
    const minimalFeed = {
      version: 'https://jsonfeed.org/version/1',
      title: 'My Example Feed',
      items: [
        {
          id: '1',
          content_html: '<p>Hello world</p>',
        },
      ],
    }
    const result = parse(minimalFeed)

    expect(result).toBeDefined()
    expect(result.version).toBe('https://jsonfeed.org/version/1')
    expect(result.title).toBe('My Example Feed')
    expect(result.home_page_url).toBeUndefined()
    expect(result.feed_url).toBeUndefined()
    expect((result as ParsedFeed).author).toBeUndefined()
  })

  it('should not include unregistered custom fields', () => {
    const result = parse(validFeedV1)

    expect((result as any).custom_field).toBeUndefined()
  })

  it('should parse number values presented as string in attachment data', () => {
    const feedWithInvalidNumbers = {
      items: [
        {
          attachments: [
            {
              size_in_bytes: 'not-a-number',
            },
          ],
        },
      ],
    }
    const result = parse(feedWithInvalidNumbers)

    expect(result.items?.[0]?.attachments?.[0]?.size_in_bytes).toBe(0)
  })

  it('should not parse number values to 0 if none is provided', () => {
    const feedWithInvalidNumbers = {
      items: [
        {
          attachments: [
            {
              size_in_bytes: undefined,
            },
          ],
        },
      ],
    }
    const result = parse(feedWithInvalidNumbers)

    expect(result.items?.[0]?.attachments?.[0]?.size_in_bytes).toBe(undefined)
  })

  it('should handle null input', () => {
    expect(() => parse(null)).toThrow()
  })

  it('should handle undefined input', () => {
    expect(() => parse(undefined)).toThrow()
  })

  it('should handle number input', () => {
    expect(() => parse(123)).toThrow()
  })

  it('should handle string input', () => {
    expect(() => parse('not a feed')).toThrow()
  })

  it('should handle empty object input', () => {
    const result = parse({})

    expect(result).toEqual({})
  })

  it('should handle array input', () => {
    expect(() => parse([])).toThrow()
  })
})
