import { beforeEach, describe, expect, it, mock } from 'bun:test'
import type { FetchUrlOptions } from '../../actions/fetchUrl.ts'
import { FetchUrlResponse } from '../../actions/fetchUrl.ts'
import type { WorkflowContext } from '../../helpers/workflows.ts'
import type { FeedData, FeedItem } from '../../types/schemas.ts'
import { jsonFeed, jsonFeedChannel, jsonFeedItems } from './jsonFeed.ts'

describe('jsonFeedChannel', () => {
  it('should return channel with all properties', () => {
    const value = {
      title: 'Test Feed',
      description: 'A test JSON feed',
      home_page_url: 'https://example.com',
      feed_url: 'https://example.com/feed.json',
    }
    const expected = {
      title: 'Test Feed',
      description: 'A test JSON feed',
      siteUrl: 'https://example.com',
      selfUrl: 'https://example.com/feed.json',
    }

    expect(jsonFeedChannel(value)).toEqual(expected)
  })

  it('should return channel with minimal properties', () => {
    const value = {}
    const expected = {
      title: undefined,
      description: undefined,
      siteUrl: undefined,
      selfUrl: undefined,
    }

    expect(jsonFeedChannel(value)).toEqual(expected)
  })

  it('should handle partial properties', () => {
    const value = {
      title: 'Test Feed',
      home_page_url: 'https://example.com',
    }
    const expected = {
      title: 'Test Feed',
      description: undefined,
      siteUrl: 'https://example.com',
      selfUrl: undefined,
    }

    expect(jsonFeedChannel(value)).toEqual(expected)
  })
})

describe('jsonFeedItems', () => {
  it('should return items with all properties', () => {
    const value = {
      items: [
        {
          id: 'item-1',
          url: 'https://example.com/post-1',
          title: 'Post 1',
          summary: 'Summary 1',
          content_html: '<p>Content 1</p>',
          authors: [{ name: 'Author 1' }],
          date_published: '2024-01-01T12:00:00Z',
        },
      ],
    }
    const expected = [
      {
        link: 'https://example.com/post-1',
        guid: 'item-1',
        title: 'Post 1',
        description: 'Summary 1',
        author: 'Author 1',
        content: '<p>Content 1</p>',
        rawPublishedAt: '2024-01-01T12:00:00Z',
        publishedAt: expect.any(Date),
        itemHash: expect.any(String),
        contentHash: expect.any(String),
      },
    ]

    expect(jsonFeedItems(value)).toEqual(expected)
  })

  it('should return empty array when items is empty', () => {
    const value = { items: [] }
    const expected: Array<FeedItem> = []

    expect(jsonFeedItems(value)).toEqual(expected)
  })

  it('should return empty array when items is undefined', () => {
    const value = {}
    const expected: Array<FeedItem> = []

    expect(jsonFeedItems(value)).toEqual(expected)
  })

  it('should use content_text when content_html is missing', () => {
    const value = {
      items: [
        {
          id: 'item-1',
          url: 'https://example.com/post-1',
          content_text: 'Plain text content',
        },
      ],
    }
    const expected = [
      {
        link: 'https://example.com/post-1',
        guid: 'item-1',
        title: undefined,
        description: undefined,
        author: undefined,
        content: 'Plain text content',
        rawPublishedAt: undefined,
        publishedAt: expect.any(Date),
        itemHash: expect.any(String),
        contentHash: expect.any(String),
      },
    ]

    expect(jsonFeedItems(value)).toEqual(expected)
  })

  it('should prefer content_html over content_text', () => {
    const value = {
      items: [
        {
          id: 'item-1',
          url: 'https://example.com/post-1',
          content_html: '<p>HTML content</p>',
          content_text: 'Plain text content',
        },
      ],
    }
    const expected = [
      {
        link: 'https://example.com/post-1',
        guid: 'item-1',
        title: undefined,
        description: undefined,
        author: undefined,
        content: '<p>HTML content</p>',
        rawPublishedAt: undefined,
        publishedAt: expect.any(Date),
        itemHash: expect.any(String),
        contentHash: expect.any(String),
      },
    ]

    expect(jsonFeedItems(value)).toEqual(expected)
  })

  it('should use date_modified when date_published is missing', () => {
    const value = {
      items: [
        {
          id: 'item-1',
          url: 'https://example.com/post-1',
          date_modified: '2024-02-01T12:00:00Z',
        },
      ],
    }
    const expected = [
      {
        link: 'https://example.com/post-1',
        guid: 'item-1',
        title: undefined,
        description: undefined,
        author: undefined,
        content: undefined,
        rawPublishedAt: '2024-02-01T12:00:00Z',
        publishedAt: expect.any(Date),
        itemHash: expect.any(String),
        contentHash: expect.any(String),
      },
    ]

    expect(jsonFeedItems(value)).toEqual(expected)
  })

  it('should deduplicate items with same checksum', () => {
    const value = {
      items: [
        {
          id: 'item-1',
          url: 'https://example.com/post-1',
          title: 'Post 1',
          date_published: '2024-01-01',
        },
        {
          id: 'item-1',
          url: 'https://example.com/post-1',
          title: 'Post 1',
          date_published: '2024-01-01',
        },
      ],
    }

    expect(jsonFeedItems(value)).toHaveLength(1)
  })
})

describe('jsonFeed', () => {
  const mockNext = mock()
  const mockSelf = mock()
  const baseContext: WorkflowContext<FeedData, FetchUrlOptions> = {
    url: 'https://example.com/feed.json',
    response: new FetchUrlResponse('{}', { url: '', contentBytes: 0 }),
  }

  beforeEach(() => {
    mockNext.mockClear()
  })

  it('should parse valid JSON Feed', async () => {
    const value = JSON.stringify({
      version: 'https://jsonfeed.org/version/1.1',
      title: 'Test JSON Feed',
      home_page_url: 'https://example.com',
      items: [
        {
          id: 'item-1',
          url: 'https://example.com/post-1',
          title: 'Test Post',
        },
      ],
    })
    const context = {
      ...baseContext,
      response: new FetchUrlResponse(value, {
        url: 'https://example.com/feed.json',
        contentBytes: value.length,
        status: 200,
      }),
    }

    await jsonFeed(context, mockNext, mockSelf)

    const expected: FeedData = {
      meta: {
        etag: null,
        lastModified: null,
        contentBytes: value.length,
        hash: undefined,
        type: 'json',
        requestUrl: 'https://example.com/feed.json',
        responseUrl: 'https://example.com/feed.json',
      },
      channel: {
        title: 'Test JSON Feed',
        description: undefined,
        siteUrl: 'https://example.com',
        selfUrl: undefined,
      },
      items: [
        {
          link: 'https://example.com/post-1',
          guid: 'item-1',
          title: 'Test Post',
          description: undefined,
          author: undefined,
          content: undefined,
          rawPublishedAt: undefined,
          publishedAt: expect.any(Date),
          itemHash: expect.any(String),
          contentHash: expect.any(String),
        },
      ],
    }

    expect(context.result).toEqual(expected)
  })
})
