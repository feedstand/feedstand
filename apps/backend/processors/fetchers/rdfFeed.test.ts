import { beforeEach, describe, expect, it, mock } from 'bun:test'
import type { FetchUrlOptions } from '../../actions/fetchUrl.ts'
import { FetchUrlResponse } from '../../actions/fetchUrl.ts'
import type { WorkflowContext } from '../../helpers/workflows.ts'
import type { FeedData, FeedItem } from '../../types/schemas.ts'
import { rdfFeed, rdfFeedChannel, rdfFeedItems } from './rdfFeed.ts'

describe('rdfFeedChannel', () => {
  it('should return channel with all properties', () => {
    const value = {
      title: 'Test Feed',
      description: 'A test RDF feed',
      link: 'https://example.com',
      atom: {
        links: [{ rel: 'self', href: 'https://example.com/feed.rdf' }],
      },
    }
    const expected = {
      title: 'Test Feed',
      description: 'A test RDF feed',
      siteUrl: 'https://example.com',
      selfUrl: 'https://example.com/feed.rdf',
    }

    expect(rdfFeedChannel(value)).toEqual(expected)
  })

  it('should return channel with minimal properties', () => {
    const value = {}
    const expected = {
      title: undefined,
      description: undefined,
      siteUrl: undefined,
      selfUrl: undefined,
    }

    expect(rdfFeedChannel(value)).toEqual(expected)
  })

  it('should use atom alternate link when link is missing', () => {
    const value = {
      title: 'Test Feed',
      atom: {
        links: [
          { rel: 'alternate', href: 'https://example.com/alternate' },
          { rel: 'self', href: 'https://example.com/feed.rdf' },
        ],
      },
    }
    const expected = {
      title: 'Test Feed',
      description: undefined,
      siteUrl: 'https://example.com/alternate',
      selfUrl: 'https://example.com/feed.rdf',
    }

    expect(rdfFeedChannel(value)).toEqual(expected)
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

    expect(rdfFeedChannel(value)).toEqual(expected)
  })
})

describe('rdfFeedItems', () => {
  it('should return items with all properties', () => {
    const value = {
      items: [
        {
          link: 'https://example.com/post-1',
          title: 'Post 1',
          description: 'Description 1',
          content: { encoded: '<p>Content 1</p>' },
          dc: { creators: ['Author 1'], dates: ['2024-01-01T12:00:00Z'] },
        },
      ],
    }
    const expected = [
      {
        link: 'https://example.com/post-1',
        guid: 'https://example.com/post-1',
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

    expect(rdfFeedItems(value)).toEqual(expected)
  })

  it('should return empty array when items is empty', () => {
    const value = { items: [] }
    const expected: Array<FeedItem> = []

    expect(rdfFeedItems(value)).toEqual(expected)
  })

  it('should return empty array when items is undefined', () => {
    const value = {}
    const expected: Array<FeedItem> = []

    expect(rdfFeedItems(value)).toEqual(expected)
  })

  it('should use atom alternate link when item link is missing', () => {
    const value = {
      items: [
        {
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
        guid: 'https://example.com/atom-link',
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

    expect(rdfFeedItems(value)).toEqual(expected)
  })

  it('should fallback to atom summary for description', () => {
    const value = {
      items: [
        {
          link: 'https://example.com/post-1',
          atom: { summary: 'Atom summary' },
        },
      ],
    }
    const expected = [
      {
        link: 'https://example.com/post-1',
        guid: 'https://example.com/post-1',
        title: undefined,
        description: 'Atom summary',
        author: undefined,
        content: undefined,
        rawPublishedAt: undefined,
        publishedAt: expect.any(Date),
        itemHash: expect.any(String),
        contentHash: expect.any(String),
      },
    ]

    expect(rdfFeedItems(value)).toEqual(expected)
  })

  it('should fallback to dc description for description', () => {
    const value = {
      items: [
        {
          link: 'https://example.com/post-1',
          dc: { descriptions: ['DC description'] },
        },
      ],
    }
    const expected = [
      {
        link: 'https://example.com/post-1',
        guid: 'https://example.com/post-1',
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

    expect(rdfFeedItems(value)).toEqual(expected)
  })

  it('should use atom author name', () => {
    const value = {
      items: [
        {
          link: 'https://example.com/post-1',
          atom: { authors: [{ name: 'Atom Author' }] },
        },
      ],
    }
    const expected = [
      {
        link: 'https://example.com/post-1',
        guid: 'https://example.com/post-1',
        title: undefined,
        description: undefined,
        author: 'Atom Author',
        content: undefined,
        rawPublishedAt: undefined,
        publishedAt: expect.any(Date),
        itemHash: expect.any(String),
        contentHash: expect.any(String),
      },
    ]

    expect(rdfFeedItems(value)).toEqual(expected)
  })

  it('should use dc creator when no atom author', () => {
    const value = {
      items: [
        {
          link: 'https://example.com/post-1',
          dc: { creators: ['DC Creator'] },
        },
      ],
    }
    const expected = [
      {
        link: 'https://example.com/post-1',
        guid: 'https://example.com/post-1',
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

    expect(rdfFeedItems(value)).toEqual(expected)
  })

  it('should use atom published date', () => {
    const value = {
      items: [
        {
          link: 'https://example.com/post-1',
          atom: { published: '2024-01-01T12:00:00Z' },
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
        rawPublishedAt: '2024-01-01T12:00:00Z',
        publishedAt: expect.any(Date),
        itemHash: expect.any(String),
        contentHash: expect.any(String),
      },
    ]

    expect(rdfFeedItems(value)).toEqual(expected)
  })

  it('should use dc date when atom published is missing', () => {
    const value = {
      items: [
        {
          link: 'https://example.com/post-1',
          dc: { dates: ['2024-02-01T12:00:00Z'] },
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

    expect(rdfFeedItems(value)).toEqual(expected)
  })

  it('should use atom updated when no other date is available', () => {
    const value = {
      items: [
        {
          link: 'https://example.com/post-1',
          atom: { updated: '2024-03-01T12:00:00Z' },
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

    expect(rdfFeedItems(value)).toEqual(expected)
  })

  it('should deduplicate items with same checksum', () => {
    const value = {
      items: [
        { link: 'https://example.com/post-1', title: 'Post 1', dc: { dates: ['2024-01-01'] } },
        { link: 'https://example.com/post-1', title: 'Post 1', dc: { dates: ['2024-01-01'] } },
      ],
    }

    expect(rdfFeedItems(value)).toHaveLength(1)
  })
})

describe('rdfFeed', () => {
  const mockNext = mock()
  const mockSelf = mock()
  const baseContext: WorkflowContext<FeedData, FetchUrlOptions> = {
    url: 'https://example.com/feed.rdf',
    response: new FetchUrlResponse('', { url: '', contentBytes: 0 }),
  }

  beforeEach(() => {
    mockNext.mockClear()
  })

  it('should parse valid RDF feed', async () => {
    const value = `
      <?xml version="1.0" encoding="UTF-8"?>
      <rdf:RDF
        xmlns:rdf="http://www.w3.org/1999/02/22-rdf-syntax-ns#"
        xmlns="http://purl.org/rss/1.0/"
      >
        <channel>
          <title>Test RDF Feed</title>
          <link>https://example.com</link>
        </channel>
        <item>
          <title>Test Item</title>
          <link>https://example.com/item-1</link>
        </item>
      </rdf:RDF>
    `
    const context = {
      ...baseContext,
      response: new FetchUrlResponse(value, {
        url: 'https://example.com/feed.rdf',
        contentBytes: value.length,
        status: 200,
      }),
    }

    await rdfFeed(context, mockNext, mockSelf)

    const expected: FeedData = {
      meta: {
        etag: null,
        lastModified: null,
        contentBytes: value.length,
        hash: undefined,
        format: 'rdf',
        requestUrl: 'https://example.com/feed.rdf',
        responseUrl: 'https://example.com/feed.rdf',
      },
      channel: {
        title: 'Test RDF Feed',
        description: undefined,
        siteUrl: 'https://example.com',
        selfUrl: undefined,
      },
      items: [
        {
          link: 'https://example.com/item-1',
          guid: 'https://example.com/item-1',
          title: 'Test Item',
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
