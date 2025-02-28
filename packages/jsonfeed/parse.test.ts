import { describe, it, expect } from 'vitest'
import { parse } from './parse'
import { ZodError } from 'zod'
import { LooseFeed, StrictFeed1 } from './types'

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

  it('should parse a valid JSON Feed v1 in loose mode', () => {
    const result = parse(validFeedV1)

    expect(result).toBeDefined()
    expect(result.version).toBe('https://jsonfeed.org/version/1')
    expect(result.title).toBe('My Example Feed')
    expect(result.items).toHaveLength(1)
    expect(result.items?.[0].id).toBe('1')
    expect(result.items?.[0].content_html).toBe('<p>Hello world</p>')
    expect((result as any).custom_field).toBeUndefined()
  })

  it('should parse a valid JSON Feed v1.1 in loose mode', () => {
    const result = parse(validFeedV11)

    expect(result).toBeDefined()
    expect(result.version).toBe('https://jsonfeed.org/version/1.1')
    expect(result.title).toBe('My Example Feed')
    expect(result.items).toHaveLength(1)
    expect(result.language).toBe('en-US')
    expect(result.authors).toHaveLength(1)
    expect(result.authors?.[0].name).toBe('John Doe')
    expect((result as any).custom_field).toBeUndefined()
  })

  it('should parse a valid JSON Feed v1 in strict mode', () => {
    const result = parse(validFeedV1, { strict: true })

    expect(result).toBeDefined()
    expect(result.version).toBe('https://jsonfeed.org/version/1')
    expect(result.title).toBe('My Example Feed')
    expect(result.items).toHaveLength(1)
    expect((result as any).custom_field).toBeUndefined()
  })

  it('should parse a valid JSON Feed v1.1 in strict mode', () => {
    const result = parse(validFeedV11, { strict: true })

    expect(result).toBeDefined()
    expect(result.version).toBe('https://jsonfeed.org/version/1.1')
    expect(result.title).toBe('My Example Feed')
    expect(result.items).toHaveLength(1)
    expect((result as any).custom_field).toBeUndefined()
  })

  it('should not reject incomplete feed in loose mode', () => {
    const invalidFeed = {
      version: 'https://jsonfeed.org/version/1',
      title: 'My Example Feed',
    }

    expect(() => parse(invalidFeed, { strict: false })).not.toThrow(ZodError)
  })

  it('should reject invalid feed in strict mode with explicit strict: true', () => {
    const invalidFeed = {
      version: 'https://jsonfeed.org/version/1',
      items: [
        {
          content_html: '<p>Hello world</p>',
        },
      ],
    }

    expect(() => parse(invalidFeed, { strict: true })).toThrow(ZodError)
  })

  it('should reject invalid feed in strict mode with default strict: true', () => {
    const invalidFeed = {
      version: 'https://jsonfeed.org/version/1',
      items: [
        {
          content_html: '<p>Hello world</p>',
        },
      ],
    }

    expect(() => parse(invalidFeed)).toThrow(ZodError)
  })

  it('should reject feed with invalid URLs in strict mode', () => {
    const invalidFeed = {
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

    expect(() => parse(invalidFeed, { strict: true })).toThrow(ZodError)
  })

  it('should parse feed with invalid URLs in loose mode', () => {
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

    const result = parse(feed, { strict: false })

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

    const result = parse(minimalFeed, { strict: true })

    expect(result).toBeDefined()
    expect(result.version).toBe('https://jsonfeed.org/version/1')
    expect(result.title).toBe('My Example Feed')
    expect(result.home_page_url).toBeUndefined()
    expect(result.feed_url).toBeUndefined()
    expect((result as StrictFeed1).author).toBeUndefined()
  })

  it('should throw on input that is a string', () => {
    expect(() => parse('not an object')).toThrow()
  })

  it('should throw on input that is a null', () => {
    expect(() => parse(null)).toThrow()
  })

  it('should throw on input that is a number', () => {
    expect(() => parse(123)).toThrow()
  })

  it('should throw on input that is an array', () => {
    expect(() => parse([])).toThrow()
  })
})
