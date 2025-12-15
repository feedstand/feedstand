import { beforeEach, describe, expect, it, mock } from 'bun:test'
import type { FetchUrlOptions } from '../actions/fetchUrl.ts'
import { FetchUrlResponse } from '../actions/fetchUrl.ts'
import type { FeedData } from '../types/schemas.ts'
import { createFeedProcessor, retrieveAlternateLink, retrieveSelfLink } from './feeds.ts'
import type { WorkflowContext } from './workflows.ts'

describe('createFeedProcessor', () => {
  const mockNext = mock()
  const mockSelf = mock()
  const mockDetect = mock()
  const mockParse = mock()
  const mockParseChannel = mock()
  const mockParseItems = mock()

  const createTestProcessor = () =>
    createFeedProcessor({
      format: 'rss',
      getContent: (response) => response.text(),
      detect: mockDetect,
      parse: mockParse,
      parseChannel: mockParseChannel,
      parseItems: mockParseItems,
    })

  const baseContext: WorkflowContext<FeedData, FetchUrlOptions> = {
    url: 'https://example.com/feed.xml',
    response: new FetchUrlResponse('', { url: '', contentBytes: 0 }),
  }

  beforeEach(() => {
    mockNext.mockClear()
    mockDetect.mockClear()
    mockParse.mockClear()
    mockParseChannel.mockClear()
    mockParseItems.mockClear()
  })

  it('should pass through when response is not ok', async () => {
    const processor = createTestProcessor()
    const context = {
      ...baseContext,
      response: new FetchUrlResponse('', { url: '', contentBytes: 0, status: 404 }),
    }

    await processor(context, mockNext, mockSelf)

    expect(mockNext).toHaveBeenCalled()
    expect(mockDetect).not.toHaveBeenCalled()
    expect(context.result).toBeUndefined()
  })

  it('should pass through when response is undefined', async () => {
    const processor = createTestProcessor()
    const context = {
      ...baseContext,
      response: undefined,
    }

    await processor(context, mockNext, mockSelf)

    expect(mockNext).toHaveBeenCalled()
    expect(mockDetect).not.toHaveBeenCalled()
  })

  it('should pass through when result already exists', async () => {
    const processor = createTestProcessor()
    const existingResult: FeedData = {
      meta: {
        etag: null,
        lastModified: null,
        contentBytes: 0,
        hash: undefined,
        format: 'atom',
        requestUrl: '',
        responseUrl: '',
      },
      channel: { selfUrl: '' },
      items: [],
    }
    const context = {
      ...baseContext,
      response: new FetchUrlResponse('', { url: '', contentBytes: 0, status: 200 }),
      result: existingResult,
    }

    await processor(context, mockNext, mockSelf)

    expect(mockNext).toHaveBeenCalled()
    expect(mockDetect).not.toHaveBeenCalled()
    expect(context.result).toBe(existingResult)
  })

  it('should pass through when detect returns false', async () => {
    const processor = createTestProcessor()
    mockDetect.mockReturnValue(false)
    const value = '<not-a-feed/>'
    const context = {
      ...baseContext,
      response: new FetchUrlResponse(value, { url: '', contentBytes: value.length, status: 200 }),
    }

    await processor(context, mockNext, mockSelf)

    expect(mockDetect).toHaveBeenCalledWith(value)
    expect(mockParse).not.toHaveBeenCalled()
    expect(mockNext).toHaveBeenCalled()
    expect(context.result).toBeUndefined()
  })

  it('should parse feed and set result when detect returns true', async () => {
    const processor = createTestProcessor()
    const value = '<feed>content</feed>'
    const parsedFeed = { title: 'Test Feed' }
    const parsedChannel = { title: 'Test Feed', selfUrl: 'https://example.com/feed.xml' }
    const parsedItems = [
      {
        link: 'https://example.com/item',
        guid: 'item-1',
        publishedAt: new Date('2024-01-01T12:00:00Z'),
      },
    ]

    mockDetect.mockReturnValue(true)
    mockParse.mockReturnValue(parsedFeed)
    mockParseChannel.mockReturnValue(parsedChannel)
    mockParseItems.mockReturnValue(parsedItems)

    const responseUrl = 'https://example.com/feed.xml'
    const context = {
      ...baseContext,
      url: 'https://example.com/feed',
      response: new FetchUrlResponse(value, {
        url: responseUrl,
        contentBytes: value.length,
        status: 200,
        hash: 'abc123',
      }),
    }

    await processor(context, mockNext, mockSelf)

    expect(mockDetect).toHaveBeenCalledWith(value)
    expect(mockParse).toHaveBeenCalledWith(value)
    expect(mockParseChannel).toHaveBeenCalledWith(parsedFeed)
    expect(mockParseItems).toHaveBeenCalledWith(parsedFeed)

    const expected: FeedData = {
      meta: {
        etag: null,
        lastModified: null,
        format: 'rss',
        requestUrl: 'https://example.com/feed',
        responseUrl: 'https://example.com/feed.xml',
        contentBytes: value.length,
        hash: 'abc123',
      },
      channel: parsedChannel,
      items: parsedItems,
    }

    expect(context.result).toEqual(expected)
    expect(mockNext).toHaveBeenCalled()
  })

  it('should store etag and last-modified from response headers', async () => {
    const processor = createTestProcessor()
    const value = '<feed/>'

    mockDetect.mockReturnValue(true)
    mockParse.mockReturnValue({})
    mockParseChannel.mockReturnValue({})
    mockParseItems.mockReturnValue([])

    const headers = new Headers()
    headers.set('etag', '"test-etag"')
    headers.set('last-modified', 'Wed, 01 Jan 2024 00:00:00 GMT')

    const context = {
      ...baseContext,
      response: new FetchUrlResponse(value, {
        url: '',
        contentBytes: value.length,
        status: 200,
        headers,
      }),
    }

    await processor(context, mockNext, mockSelf)

    expect(context.result?.meta.etag).toBe('"test-etag"')
    expect(context.result?.meta.lastModified).toBe('Wed, 01 Jan 2024 00:00:00 GMT')
  })

  it('should set error on context when getContent throws', async () => {
    const error = new Error('Failed to get content')
    const processor = createFeedProcessor({
      format: 'rss',
      getContent: () => Promise.reject(error),
      detect: mockDetect,
      parse: mockParse,
      parseChannel: mockParseChannel,
      parseItems: mockParseItems,
    })

    const context = {
      ...baseContext,
      response: new FetchUrlResponse('', { url: '', contentBytes: 0, status: 200 }),
    }

    await processor(context, mockNext, mockSelf)

    expect(context.error).toBe(error)
    expect(context.result).toBeUndefined()
    expect(mockNext).toHaveBeenCalled()
  })

  it('should set error on context when parse throws', async () => {
    const processor = createTestProcessor()
    const error = new Error('Parse error')

    mockDetect.mockReturnValue(true)
    mockParse.mockImplementation(() => {
      throw error
    })

    const value = '<invalid/>'
    const context = {
      ...baseContext,
      response: new FetchUrlResponse(value, { url: '', contentBytes: value.length, status: 200 }),
    }

    await processor(context, mockNext, mockSelf)

    expect(context.error).toBe(error)
    expect(context.result).toBeUndefined()
    expect(mockNext).toHaveBeenCalled()
  })

  it('should set error on context when parseChannel throws', async () => {
    const processor = createTestProcessor()
    const error = new Error('Channel parse error')

    mockDetect.mockReturnValue(true)
    mockParse.mockReturnValue({})
    mockParseChannel.mockImplementation(() => {
      throw error
    })

    const value = '<feed/>'
    const context = {
      ...baseContext,
      response: new FetchUrlResponse(value, { url: '', contentBytes: value.length, status: 200 }),
    }

    await processor(context, mockNext, mockSelf)

    expect(context.error).toBe(error)
    expect(context.result).toBeUndefined()
    expect(mockNext).toHaveBeenCalled()
  })

  it('should use correct format in meta', async () => {
    const jsonProcessor = createFeedProcessor({
      format: 'json',
      getContent: (response) => response.json(),
      detect: () => true,
      parse: (content) => content,
      parseChannel: () => ({}),
      parseItems: () => [],
    })

    const value = JSON.stringify({ version: 'https://jsonfeed.org/version/1.1' })
    const context = {
      ...baseContext,
      response: new FetchUrlResponse(value, { url: '', contentBytes: value.length, status: 200 }),
    }

    await jsonProcessor(context, mockNext, mockSelf)

    expect(context.result?.meta.format).toBe('json')
  })

  it('should set error on context when parseItems throws', async () => {
    const error = new Error('Items parse error')
    const processor = createFeedProcessor({
      format: 'rss',
      getContent: (response) => response.text(),
      detect: () => true,
      parse: (content) => content,
      parseChannel: () => ({}),
      parseItems: () => {
        throw error
      },
    })

    const value = '<feed/>'
    const context = {
      ...baseContext,
      response: new FetchUrlResponse(value, { url: '', contentBytes: value.length, status: 200 }),
    }

    await processor(context, mockNext, mockSelf)

    expect(context.error).toBe(error)
    expect(context.result).toBeUndefined()
    expect(mockNext).toHaveBeenCalled()
  })
})

describe('retrieveAlternateLink', () => {
  it('should return href when rel is alternate', () => {
    const value = [{ rel: 'alternate', href: 'https://example.com' }]
    const expected = 'https://example.com'

    expect(retrieveAlternateLink(value)).toBe(expected)
  })

  it('should return href when rel is undefined', () => {
    const value = [{ href: 'https://example.com/default' }]
    const expected = 'https://example.com/default'

    expect(retrieveAlternateLink(value)).toBe(expected)
  })

  it('should return undefined when links is undefined', () => {
    expect(retrieveAlternateLink(undefined)).toBeUndefined()
  })

  it('should return undefined when no matching link found', () => {
    const value = [{ rel: 'self', href: 'https://example.com/self' }]

    expect(retrieveAlternateLink(value)).toBeUndefined()
  })

  it('should return undefined when href is missing', () => {
    const value = [{ rel: 'alternate' }]

    expect(retrieveAlternateLink(value)).toBeUndefined()
  })

  it('should return first matching link when multiple exist', () => {
    const value = [
      { rel: 'alternate', href: 'https://example.com/first' },
      { rel: 'alternate', href: 'https://example.com/second' },
    ]
    const expected = 'https://example.com/first'

    expect(retrieveAlternateLink(value)).toBe(expected)
  })
})

describe('retrieveSelfLink', () => {
  it('should return href when rel is self', () => {
    const value = [{ rel: 'self', href: 'https://example.com/feed.xml' }]
    const expected = 'https://example.com/feed.xml'

    expect(retrieveSelfLink(value)).toBe(expected)
  })

  it('should return undefined when links is undefined', () => {
    expect(retrieveSelfLink(undefined)).toBeUndefined()
  })

  it('should return undefined when no self link found', () => {
    const value = [{ rel: 'alternate', href: 'https://example.com' }]

    expect(retrieveSelfLink(value)).toBeUndefined()
  })

  it('should return undefined when href is missing', () => {
    const value = [{ rel: 'self' }]

    expect(retrieveSelfLink(value)).toBeUndefined()
  })

  it('should return undefined when rel is undefined', () => {
    const value = [{ href: 'https://example.com/feed.xml' }]

    expect(retrieveSelfLink(value)).toBeUndefined()
  })
})
