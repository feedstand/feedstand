import { beforeEach, describe, expect, it, mock } from 'bun:test'
import type { FetchUrlOptions } from '../../actions/fetchUrl.ts'
import { FetchUrlResponse } from '../../actions/fetchUrl.ts'
import type { WorkflowContext } from '../../helpers/workflows.ts'
import type { FeedData, FeedItem } from '../../types/schemas.ts'
import { rssFeed, rssFeedChannel, rssFeedItems } from './rssFeed.ts'

describe('rssFeedChannel', () => {
  it('should return channel with all properties', () => {
    const value = {
      title: 'Test Feed',
      description: 'A test RSS feed',
      link: 'https://example.com',
      atom: {
        links: [{ rel: 'self', href: 'https://example.com/feed.xml' }],
      },
    }
    const expected = {
      title: 'Test Feed',
      description: 'A test RSS feed',
      siteUrl: 'https://example.com',
      selfUrl: 'https://example.com/feed.xml',
    }

    expect(rssFeedChannel(value)).toEqual(expected)
  })

  it('should return channel with minimal properties', () => {
    const value = {}
    const expected = {
      title: undefined,
      description: undefined,
      siteUrl: undefined,
      selfUrl: undefined,
    }

    expect(rssFeedChannel(value)).toEqual(expected)
  })

  it('should use atom alternate link when link is missing', () => {
    const value = {
      title: 'Test Feed',
      atom: {
        links: [
          { rel: 'alternate', href: 'https://example.com/alternate' },
          { rel: 'self', href: 'https://example.com/feed.xml' },
        ],
      },
    }
    const expected = {
      title: 'Test Feed',
      description: undefined,
      siteUrl: 'https://example.com/alternate',
      selfUrl: 'https://example.com/feed.xml',
    }

    expect(rssFeedChannel(value)).toEqual(expected)
  })

  it('should use link without rel attribute as alternate', () => {
    const value = {
      title: 'Test Feed',
      atom: {
        links: [{ href: 'https://example.com/default' }],
      },
    }
    const expected = {
      title: 'Test Feed',
      description: undefined,
      siteUrl: 'https://example.com/default',
      selfUrl: undefined,
    }

    expect(rssFeedChannel(value)).toEqual(expected)
  })

  it('should prefer direct link over atom alternate', () => {
    const value = {
      title: 'Test Feed',
      link: 'https://example.com/direct',
      atom: {
        links: [{ rel: 'alternate', href: 'https://example.com/alternate' }],
      },
    }
    const expected = {
      title: 'Test Feed',
      description: undefined,
      siteUrl: 'https://example.com/direct',
      selfUrl: undefined,
    }

    expect(rssFeedChannel(value)).toEqual(expected)
  })

  it('should handle empty atom links array', () => {
    const value = {
      title: 'Test Feed',
      atom: { links: [] },
    }
    const expected = {
      title: 'Test Feed',
      description: undefined,
      siteUrl: undefined,
      selfUrl: undefined,
    }

    expect(rssFeedChannel(value)).toEqual(expected)
  })
})

describe('rssFeedItems', () => {
  it('should return items with all properties', () => {
    const value = {
      items: [
        {
          link: 'https://example.com/post-1',
          guid: { value: 'guid-1' },
          title: 'Post 1',
          description: 'Description 1',
          authors: ['Author 1'],
          content: { encoded: '<p>Content 1</p>' },
          pubDate: '2024-01-01T12:00:00Z',
        },
      ],
    }
    const expected = [
      {
        link: 'https://example.com/post-1',
        guid: 'guid-1',
        title: 'Post 1',
        description: 'Description 1',
        author: 'Author 1',
        content: '<p>Content 1</p>',
        rawPublishedAt: '2024-01-01T12:00:00Z',
        publishedAt: expect.any(Date),
        itemHash: expect.any(String),
        contentHash: expect.any(String),
      },
    ]

    expect(rssFeedItems(value)).toEqual(expected)
  })

  it('should return empty array when items is empty', () => {
    const value = { items: [] }
    const expected: Array<FeedItem> = []

    expect(rssFeedItems(value)).toEqual(expected)
  })

  it('should return empty array when items is undefined', () => {
    const value = {}
    const expected: Array<FeedItem> = []

    expect(rssFeedItems(value)).toEqual(expected)
  })

  it('should use link as guid when guid is missing', () => {
    const value = {
      items: [
        {
          link: 'https://example.com/post-1',
          title: 'Post 1',
        },
      ],
    }
    const expected = [
      {
        link: 'https://example.com/post-1',
        guid: 'https://example.com/post-1',
        title: 'Post 1',
        description: undefined,
        author: undefined,
        content: undefined,
        rawPublishedAt: undefined,
        publishedAt: expect.any(Date),
        itemHash: expect.any(String),
        contentHash: expect.any(String),
      },
    ]

    expect(rssFeedItems(value)).toEqual(expected)
  })

  it('should use atom alternate link when item link is missing', () => {
    const value = {
      items: [
        {
          guid: { value: 'guid-1' },
          title: 'Post 1',
          atom: {
            links: [{ rel: 'alternate', href: 'https://example.com/atom-link' }],
          },
        },
      ],
    }
    const expected = [
      {
        link: 'https://example.com/atom-link',
        guid: 'guid-1',
        title: 'Post 1',
        description: undefined,
        author: undefined,
        content: undefined,
        rawPublishedAt: undefined,
        publishedAt: expect.any(Date),
        itemHash: expect.any(String),
        contentHash: expect.any(String),
      },
    ]

    expect(rssFeedItems(value)).toEqual(expected)
  })

  it('should fallback to atom summary for description', () => {
    const value = {
      items: [
        {
          link: 'https://example.com/post-1',
          title: 'Post 1',
          atom: { summary: 'Atom summary' },
        },
      ],
    }
    const expected = [
      {
        link: 'https://example.com/post-1',
        guid: 'https://example.com/post-1',
        title: 'Post 1',
        description: 'Atom summary',
        author: undefined,
        content: undefined,
        rawPublishedAt: undefined,
        publishedAt: expect.any(Date),
        itemHash: expect.any(String),
        contentHash: expect.any(String),
      },
    ]

    expect(rssFeedItems(value)).toEqual(expected)
  })

  it('should fallback to dc description for description', () => {
    const value = {
      items: [
        {
          link: 'https://example.com/post-1',
          title: 'Post 1',
          dc: { descriptions: ['DC description'] },
        },
      ],
    }
    const expected = [
      {
        link: 'https://example.com/post-1',
        guid: 'https://example.com/post-1',
        title: 'Post 1',
        description: 'DC description',
        author: undefined,
        content: undefined,
        rawPublishedAt: undefined,
        publishedAt: expect.any(Date),
        itemHash: expect.any(String),
        contentHash: expect.any(String),
      },
    ]

    expect(rssFeedItems(value)).toEqual(expected)
  })

  it('should prefer description over atom summary', () => {
    const value = {
      items: [
        {
          link: 'https://example.com/post-1',
          title: 'Post 1',
          description: 'Direct description',
          atom: { summary: 'Atom summary' },
        },
      ],
    }
    const expected = [
      {
        link: 'https://example.com/post-1',
        guid: 'https://example.com/post-1',
        title: 'Post 1',
        description: 'Direct description',
        author: undefined,
        content: undefined,
        rawPublishedAt: undefined,
        publishedAt: expect.any(Date),
        itemHash: expect.any(String),
        contentHash: expect.any(String),
      },
    ]

    expect(rssFeedItems(value)).toEqual(expected)
  })

  it('should use atom author name when authors array is empty', () => {
    const value = {
      items: [
        {
          link: 'https://example.com/post-1',
          title: 'Post 1',
          atom: { authors: [{ name: 'Atom Author' }] },
        },
      ],
    }
    const expected = [
      {
        link: 'https://example.com/post-1',
        guid: 'https://example.com/post-1',
        title: 'Post 1',
        description: undefined,
        author: 'Atom Author',
        content: undefined,
        rawPublishedAt: undefined,
        publishedAt: expect.any(Date),
        itemHash: expect.any(String),
        contentHash: expect.any(String),
      },
    ]

    expect(rssFeedItems(value)).toEqual(expected)
  })

  it('should use dc creator when no other author is available', () => {
    const value = {
      items: [
        {
          link: 'https://example.com/post-1',
          title: 'Post 1',
          dc: { creators: ['DC Creator'] },
        },
      ],
    }
    const expected = [
      {
        link: 'https://example.com/post-1',
        guid: 'https://example.com/post-1',
        title: 'Post 1',
        description: undefined,
        author: 'DC Creator',
        content: undefined,
        rawPublishedAt: undefined,
        publishedAt: expect.any(Date),
        itemHash: expect.any(String),
        contentHash: expect.any(String),
      },
    ]

    expect(rssFeedItems(value)).toEqual(expected)
  })

  it('should prefer authors array over atom author', () => {
    const value = {
      items: [
        {
          link: 'https://example.com/post-1',
          title: 'Post 1',
          authors: ['Direct Author'],
          atom: { authors: [{ name: 'Atom Author' }] },
        },
      ],
    }
    const expected = [
      {
        link: 'https://example.com/post-1',
        guid: 'https://example.com/post-1',
        title: 'Post 1',
        description: undefined,
        author: 'Direct Author',
        content: undefined,
        rawPublishedAt: undefined,
        publishedAt: expect.any(Date),
        itemHash: expect.any(String),
        contentHash: expect.any(String),
      },
    ]

    expect(rssFeedItems(value)).toEqual(expected)
  })

  it('should use atom published date when pubDate is missing', () => {
    const value = {
      items: [
        {
          link: 'https://example.com/post-1',
          atom: { published: '2024-02-01T12:00:00Z' },
        },
      ],
    }
    const expected = [
      {
        link: 'https://example.com/post-1',
        guid: 'https://example.com/post-1',
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

    expect(rssFeedItems(value)).toEqual(expected)
  })

  it('should use dc date when no other date is available', () => {
    const value = {
      items: [
        {
          link: 'https://example.com/post-1',
          dc: { dates: ['2024-03-01T12:00:00Z'] },
        },
      ],
    }
    const expected = [
      {
        link: 'https://example.com/post-1',
        guid: 'https://example.com/post-1',
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

    expect(rssFeedItems(value)).toEqual(expected)
  })

  it('should use atom updated when no other date is available', () => {
    const value = {
      items: [
        {
          link: 'https://example.com/post-1',
          atom: { updated: '2024-04-01T12:00:00Z' },
        },
      ],
    }
    const expected = [
      {
        link: 'https://example.com/post-1',
        guid: 'https://example.com/post-1',
        title: undefined,
        description: undefined,
        author: undefined,
        content: undefined,
        rawPublishedAt: '2024-04-01T12:00:00Z',
        publishedAt: expect.any(Date),
        itemHash: expect.any(String),
        contentHash: expect.any(String),
      },
    ]

    expect(rssFeedItems(value)).toEqual(expected)
  })

  it('should parse multiple items', () => {
    const value = {
      items: [
        { link: 'https://example.com/post-1', title: 'Post 1' },
        { link: 'https://example.com/post-2', title: 'Post 2' },
        { link: 'https://example.com/post-3', title: 'Post 3' },
      ],
    }
    const expected = [
      {
        link: 'https://example.com/post-1',
        guid: 'https://example.com/post-1',
        title: 'Post 1',
        description: undefined,
        author: undefined,
        content: undefined,
        rawPublishedAt: undefined,
        publishedAt: expect.any(Date),
        itemHash: expect.any(String),
        contentHash: expect.any(String),
      },
      {
        link: 'https://example.com/post-2',
        guid: 'https://example.com/post-2',
        title: 'Post 2',
        description: undefined,
        author: undefined,
        content: undefined,
        rawPublishedAt: undefined,
        publishedAt: expect.any(Date),
        itemHash: expect.any(String),
        contentHash: expect.any(String),
      },
      {
        link: 'https://example.com/post-3',
        guid: 'https://example.com/post-3',
        title: 'Post 3',
        description: undefined,
        author: undefined,
        content: undefined,
        rawPublishedAt: undefined,
        publishedAt: expect.any(Date),
        itemHash: expect.any(String),
        contentHash: expect.any(String),
      },
    ]

    expect(rssFeedItems(value)).toEqual(expected)
  })

  it('should deduplicate items with same checksum', () => {
    const value = {
      items: [
        { link: 'https://example.com/post-1', title: 'Post 1', pubDate: '2024-01-01' },
        { link: 'https://example.com/post-1', title: 'Post 1', pubDate: '2024-01-01' },
      ],
    }

    expect(rssFeedItems(value)).toHaveLength(1)
  })
})

describe('rssFeed', () => {
  const mockNext = mock()
  const mockSelf = mock()
  const baseContext: WorkflowContext<FeedData, FetchUrlOptions> = {
    url: 'https://example.com/feed.xml',
    response: new FetchUrlResponse('', { url: '', contentBytes: 0 }),
  }

  beforeEach(() => {
    mockNext.mockClear()
  })

  it('should parse valid RSS feed', async () => {
    const value = `
      <?xml version="1.0" encoding="UTF-8"?>
      <rss version="2.0">
        <channel>
          <title>Test RSS Feed</title>
          <link>https://example.com</link>
          <item>
            <title>Test Post</title>
            <link>https://example.com/post-1</link>
          </item>
        </channel>
      </rss>
    `
    const context = {
      ...baseContext,
      response: new FetchUrlResponse(value, {
        url: 'https://example.com/feed.xml',
        contentBytes: value.length,
        status: 200,
      }),
    }

    await rssFeed(context, mockNext, mockSelf)

    const expected: FeedData = {
      meta: {
        etag: null,
        lastModified: null,
        contentBytes: value.length,
        hash: undefined,
        format: 'rss',
        requestUrl: 'https://example.com/feed.xml',
        responseUrl: 'https://example.com/feed.xml',
      },
      channel: {
        title: 'Test RSS Feed',
        description: undefined,
        siteUrl: 'https://example.com',
        selfUrl: undefined,
      },
      items: [
        {
          link: 'https://example.com/post-1',
          guid: 'https://example.com/post-1',
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
