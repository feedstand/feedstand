import { beforeEach, describe, expect, it, mock } from 'bun:test'
import type { FetchUrlOptions } from '../../actions/fetchUrl.ts'
import { FetchUrlResponse } from '../../actions/fetchUrl.ts'
import type { WorkflowContext } from '../../helpers/workflows.ts'
import type { FeedData, FeedItem } from '../../types/schemas.ts'
import { atomFeed, atomFeedChannel, atomFeedItems } from './atomFeed.ts'

describe('atomFeedChannel', () => {
  it('should return channel with all properties', () => {
    const value = {
      title: 'Test Feed',
      subtitle: 'A test Atom feed',
      links: [
        { rel: 'alternate', href: 'https://example.com' },
        { rel: 'self', href: 'https://example.com/feed.xml' },
      ],
    }
    const expected = {
      title: 'Test Feed',
      description: 'A test Atom feed',
      siteUrl: 'https://example.com',
      selfUrl: 'https://example.com/feed.xml',
    }

    expect(atomFeedChannel(value)).toEqual(expected)
  })

  it('should return channel with minimal properties', () => {
    const value = {}
    const expected = {
      title: undefined,
      description: undefined,
      siteUrl: undefined,
      selfUrl: undefined,
    }

    expect(atomFeedChannel(value)).toEqual(expected)
  })

  it('should use link without rel as alternate', () => {
    const value = {
      title: 'Test Feed',
      links: [{ href: 'https://example.com/default' }],
    }
    const expected = {
      title: 'Test Feed',
      description: undefined,
      siteUrl: 'https://example.com/default',
      selfUrl: undefined,
    }

    expect(atomFeedChannel(value)).toEqual(expected)
  })

  it('should handle empty links array', () => {
    const value = {
      title: 'Test Feed',
      links: [],
    }
    const expected = {
      title: 'Test Feed',
      description: undefined,
      siteUrl: undefined,
      selfUrl: undefined,
    }

    expect(atomFeedChannel(value)).toEqual(expected)
  })
})

describe('atomFeedItems', () => {
  it('should return items with all properties', () => {
    const value = {
      entries: [
        {
          id: 'entry-1',
          title: 'Entry 1',
          summary: 'Summary 1',
          content: '<p>Content 1</p>',
          links: [{ rel: 'alternate', href: 'https://example.com/entry-1' }],
          authors: [{ name: 'Author 1' }],
          published: '2024-01-01T12:00:00Z',
        },
      ],
    }
    const expected = [
      {
        link: 'https://example.com/entry-1',
        guid: 'entry-1',
        title: 'Entry 1',
        description: 'Summary 1',
        author: 'Author 1',
        content: '<p>Content 1</p>',
        rawPublishedAt: '2024-01-01T12:00:00Z',
        publishedAt: expect.any(Date),
        itemHash: expect.any(String),
        contentHash: expect.any(String),
      },
    ]

    expect(atomFeedItems(value)).toEqual(expected)
  })

  it('should return empty array when entries is empty', () => {
    const value = { entries: [] }
    const expected: Array<FeedItem> = []

    expect(atomFeedItems(value)).toEqual(expected)
  })

  it('should return empty array when entries is undefined', () => {
    const value = {}
    const expected: Array<FeedItem> = []

    expect(atomFeedItems(value)).toEqual(expected)
  })

  it('should use link as guid when id is missing', () => {
    const value = {
      entries: [
        {
          title: 'Entry 1',
          links: [{ rel: 'alternate', href: 'https://example.com/entry-1' }],
        },
      ],
    }
    const expected = [
      {
        link: 'https://example.com/entry-1',
        guid: 'https://example.com/entry-1',
        title: 'Entry 1',
        description: undefined,
        author: undefined,
        content: undefined,
        rawPublishedAt: undefined,
        publishedAt: expect.any(Date),
        itemHash: expect.any(String),
        contentHash: expect.any(String),
      },
    ]

    expect(atomFeedItems(value)).toEqual(expected)
  })

  it('should fallback to dc description for summary', () => {
    const value = {
      entries: [
        {
          id: 'entry-1',
          links: [{ rel: 'alternate', href: 'https://example.com/entry-1' }],
          dc: { descriptions: ['DC description'] },
        },
      ],
    }
    const expected = [
      {
        link: 'https://example.com/entry-1',
        guid: 'entry-1',
        title: undefined,
        description: 'DC description',
        author: undefined,
        content: undefined,
        rawPublishedAt: undefined,
        publishedAt: expect.any(Date),
        itemHash: expect.any(String),
        contentHash: expect.any(String),
      },
    ]

    expect(atomFeedItems(value)).toEqual(expected)
  })

  it('should use dc creator when no author is available', () => {
    const value = {
      entries: [
        {
          id: 'entry-1',
          links: [{ rel: 'alternate', href: 'https://example.com/entry-1' }],
          dc: { creators: ['DC Creator'] },
        },
      ],
    }
    const expected = [
      {
        link: 'https://example.com/entry-1',
        guid: 'entry-1',
        title: undefined,
        description: undefined,
        author: 'DC Creator',
        content: undefined,
        rawPublishedAt: undefined,
        publishedAt: expect.any(Date),
        itemHash: expect.any(String),
        contentHash: expect.any(String),
      },
    ]

    expect(atomFeedItems(value)).toEqual(expected)
  })

  it('should use dc date when published is missing', () => {
    const value = {
      entries: [
        {
          id: 'entry-1',
          links: [{ rel: 'alternate', href: 'https://example.com/entry-1' }],
          dc: { dates: ['2024-02-01T12:00:00Z'] },
        },
      ],
    }
    const expected = [
      {
        link: 'https://example.com/entry-1',
        guid: 'entry-1',
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

    expect(atomFeedItems(value)).toEqual(expected)
  })

  it('should use updated when no other date is available', () => {
    const value = {
      entries: [
        {
          id: 'entry-1',
          links: [{ rel: 'alternate', href: 'https://example.com/entry-1' }],
          updated: '2024-03-01T12:00:00Z',
        },
      ],
    }
    const expected = [
      {
        link: 'https://example.com/entry-1',
        guid: 'entry-1',
        title: undefined,
        description: undefined,
        author: undefined,
        content: undefined,
        rawPublishedAt: '2024-03-01T12:00:00Z',
        publishedAt: expect.any(Date),
        itemHash: expect.any(String),
        contentHash: expect.any(String),
      },
    ]

    expect(atomFeedItems(value)).toEqual(expected)
  })

  it('should deduplicate entries with same checksum', () => {
    const value = {
      entries: [
        {
          id: 'entry-1',
          title: 'Entry 1',
          links: [{ rel: 'alternate', href: 'https://example.com/entry-1' }],
          published: '2024-01-01',
        },
        {
          id: 'entry-1',
          title: 'Entry 1',
          links: [{ rel: 'alternate', href: 'https://example.com/entry-1' }],
          published: '2024-01-01',
        },
      ],
    }

    expect(atomFeedItems(value)).toHaveLength(1)
  })
})

describe('atomFeed', () => {
  const mockNext = mock()
  const mockSelf = mock()
  const baseContext: WorkflowContext<FeedData, FetchUrlOptions> = {
    url: 'https://example.com/feed.xml',
    response: new FetchUrlResponse('', { url: '', contentBytes: 0 }),
  }

  beforeEach(() => {
    mockNext.mockClear()
  })

  it('should parse valid Atom feed', async () => {
    const value = `
      <?xml version="1.0" encoding="UTF-8"?>
      <feed xmlns="http://www.w3.org/2005/Atom">
        <title>Test Atom Feed</title>
        <link href="https://example.com" rel="alternate"/>
        <entry>
          <title>Test Entry</title>
          <id>entry-1</id>
          <link href="https://example.com/entry-1" rel="alternate"/>
        </entry>
      </feed>
    `
    const context = {
      ...baseContext,
      response: new FetchUrlResponse(value, {
        url: 'https://example.com/feed.xml',
        contentBytes: value.length,
        status: 200,
      }),
    }

    await atomFeed(context, mockNext, mockSelf)

    const expected: FeedData = {
      meta: {
        etag: null,
        lastModified: null,
        contentBytes: value.length,
        hash: undefined,
        format: 'atom',
        requestUrl: 'https://example.com/feed.xml',
        responseUrl: 'https://example.com/feed.xml',
      },
      channel: {
        title: 'Test Atom Feed',
        description: undefined,
        siteUrl: 'https://example.com',
        selfUrl: undefined,
      },
      items: [
        {
          link: 'https://example.com/entry-1',
          guid: 'entry-1',
          title: 'Test Entry',
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
