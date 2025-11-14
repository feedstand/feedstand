import { describe, expect, it } from 'vitest'
import { extractFeedUrlsFromHeaders } from './webpageHeadersFinder.ts'

describe('extractFeedUrlsFromHeaders', () => {
  const baseUrl = 'https://example.com'

  const createHeaders = (linkHeaderValue: string): Headers => {
    const headers = new Headers()
    headers.set('link', linkHeaderValue)
    return headers
  }

  describe('single feed links', () => {
    it('should find RSS feed link', () => {
      const value = '<https://example.com/feed.xml>; rel="alternate"; type="application/rss+xml"'
      const headers = createHeaders(value)
      const expected = new Set(['https://example.com/feed.xml'])

      expect(extractFeedUrlsFromHeaders(headers, baseUrl)).toEqual(expected)
    })

    it('should find Atom feed link', () => {
      const value = '<https://example.com/atom.xml>; rel="alternate"; type="application/atom+xml"'
      const headers = createHeaders(value)
      const expected = new Set(['https://example.com/atom.xml'])

      expect(extractFeedUrlsFromHeaders(headers, baseUrl)).toEqual(expected)
    })

    it('should find JSON feed link', () => {
      const value = '<https://example.com/feed.json>; rel="alternate"; type="application/json"'
      const headers = createHeaders(value)
      const expected = new Set(['https://example.com/feed.json'])

      expect(extractFeedUrlsFromHeaders(headers, baseUrl)).toEqual(expected)
    })

    it('should find feed with title attribute', () => {
      const value =
        '<https://example.com/feed.xml>; rel="alternate"; type="application/rss+xml"; title="My Feed"'
      const headers = createHeaders(value)
      const expected = new Set(['https://example.com/feed.xml'])

      expect(extractFeedUrlsFromHeaders(headers, baseUrl)).toEqual(expected)
    })
  })

  describe('multiple feed links', () => {
    it('should find multiple feeds in single header', () => {
      const value =
        '<https://example.com/rss.xml>; rel="alternate"; type="application/rss+xml", <https://example.com/atom.xml>; rel="alternate"; type="application/atom+xml"'
      const headers = createHeaders(value)
      const expected = new Set(['https://example.com/rss.xml', 'https://example.com/atom.xml'])

      expect(extractFeedUrlsFromHeaders(headers, baseUrl)).toEqual(expected)
    })

    it('should find feeds with various attributes', () => {
      const value = `<https://example.com/type/standard/feed/>; rel="alternate"; type="application/rss+xml"; title="Standard Feed", <https://example.com/type/aside/feed/>; rel="alternate"; type="application/rss+xml"; title="Aside Feed", <https://example.com/atom.xml>; rel="alternate"; type="application/atom+xml"`
      const headers = createHeaders(value)
      const expected = new Set([
        'https://example.com/type/standard/feed/',
        'https://example.com/type/aside/feed/',
        'https://example.com/atom.xml',
      ])

      expect(extractFeedUrlsFromHeaders(headers, baseUrl)).toEqual(expected)
    })
  })

  describe('attribute formats', () => {
    it('should handle attributes without quotes', () => {
      const value = '<https://example.com/feed.xml>; rel=alternate; type=application/rss+xml'
      const headers = createHeaders(value)
      const expected = new Set(['https://example.com/feed.xml'])

      expect(extractFeedUrlsFromHeaders(headers, baseUrl)).toEqual(expected)
    })

    it('should handle single quotes', () => {
      const value = "<https://example.com/feed.xml>; rel='alternate'; type='application/rss+xml'"
      const headers = createHeaders(value)
      const expected = new Set(['https://example.com/feed.xml'])

      expect(extractFeedUrlsFromHeaders(headers, baseUrl)).toEqual(expected)
    })

    it('should handle mixed quotes', () => {
      const value = '<https://example.com/feed.xml>; rel="alternate"; type=\'application/rss+xml\''
      const headers = createHeaders(value)
      const expected = new Set(['https://example.com/feed.xml'])

      expect(extractFeedUrlsFromHeaders(headers, baseUrl)).toEqual(expected)
    })

    it('should handle uppercase attribute values', () => {
      const value = '<https://example.com/feed.xml>; rel="ALTERNATE"; type="APPLICATION/RSS+XML"'
      const headers = createHeaders(value)
      const expected = new Set(['https://example.com/feed.xml'])

      expect(extractFeedUrlsFromHeaders(headers, baseUrl)).toEqual(expected)
    })

    it('should handle mixed case attribute values', () => {
      const value = '<https://example.com/feed.xml>; rel="Alternate"; type="Application/Rss+Xml"'
      const headers = createHeaders(value)
      const expected = new Set(['https://example.com/feed.xml'])

      expect(extractFeedUrlsFromHeaders(headers, baseUrl)).toEqual(expected)
    })

    it('should handle extra whitespace', () => {
      const value =
        '<https://example.com/feed.xml> ;  rel="alternate" ;  type="application/rss+xml"  '
      const headers = createHeaders(value)
      const expected = new Set(['https://example.com/feed.xml'])

      expect(extractFeedUrlsFromHeaders(headers, baseUrl)).toEqual(expected)
    })

    it('should handle attributes in different order', () => {
      const value = '<https://example.com/feed.xml>; type="application/rss+xml"; rel="alternate"'
      const headers = createHeaders(value)
      const expected = new Set(['https://example.com/feed.xml'])

      expect(extractFeedUrlsFromHeaders(headers, baseUrl)).toEqual(expected)
    })
  })

  describe('URL resolution', () => {
    it('should resolve relative URLs', () => {
      const value = '</feed.xml>; rel="alternate"; type="application/rss+xml"'
      const headers = createHeaders(value)
      const expected = new Set(['https://example.com/feed.xml'])

      expect(extractFeedUrlsFromHeaders(headers, baseUrl)).toEqual(expected)
    })

    it('should resolve relative URLs with path', () => {
      const value = '</blog/feed.xml>; rel="alternate"; type="application/rss+xml"'
      const headers = createHeaders(value)
      const expected = new Set(['https://example.com/blog/feed.xml'])

      expect(extractFeedUrlsFromHeaders(headers, baseUrl)).toEqual(expected)
    })

    it('should handle protocol-relative URLs', () => {
      const value = '<//feeds.example.com/rss.xml>; rel="alternate"; type="application/rss+xml"'
      const headers = createHeaders(value)
      const expected = new Set(['https://feeds.example.com/rss.xml'])

      expect(extractFeedUrlsFromHeaders(headers, baseUrl)).toEqual(expected)
    })

    it('should handle absolute URLs', () => {
      const value =
        '<https://feeds.example.com/rss.xml>; rel="alternate"; type="application/rss+xml"'
      const headers = createHeaders(value)
      const expected = new Set(['https://feeds.example.com/rss.xml'])

      expect(extractFeedUrlsFromHeaders(headers, baseUrl)).toEqual(expected)
    })

    it('should resolve URLs with baseUrl having path', () => {
      const value = '<feed.xml>; rel="alternate"; type="application/rss+xml"'
      const headers = createHeaders(value)
      const baseUrlWithPath = 'https://example.com/blog/'
      const expected = new Set(['https://example.com/blog/feed.xml'])

      expect(extractFeedUrlsFromHeaders(headers, baseUrlWithPath)).toEqual(expected)
    })
  })

  describe('filtering', () => {
    it('should ignore link without rel="alternate"', () => {
      const value = '<https://example.com/feed.xml>; type="application/rss+xml"'
      const headers = createHeaders(value)
      const expected = new Set()

      expect(extractFeedUrlsFromHeaders(headers, baseUrl)).toEqual(expected)
    })

    it('should ignore link without feed type', () => {
      const value = '<https://example.com/page.html>; rel="alternate"; type="text/html"'
      const headers = createHeaders(value)
      const expected = new Set()

      expect(extractFeedUrlsFromHeaders(headers, baseUrl)).toEqual(expected)
    })

    it('should ignore wp-json/oembed/ URI', () => {
      const value =
        '<https://example.com/wp-json/oembed/1.0/embed>; rel="alternate"; type="application/json+oembed"'
      const headers = createHeaders(value)
      const expected = new Set()

      expect(extractFeedUrlsFromHeaders(headers, baseUrl)).toEqual(expected)
    })

    it('should ignore wp-json/wp/ URI', () => {
      const value =
        '<https://example.com/wp-json/wp/v2/posts>; rel="alternate"; type="application/json"'
      const headers = createHeaders(value)
      const expected = new Set()

      expect(extractFeedUrlsFromHeaders(headers, baseUrl)).toEqual(expected)
    })

    it('should find valid feeds but ignore WordPress JSON URIs', () => {
      const value =
        '<https://example.com/feed>; rel="alternate"; type="application/rss+xml", <https://example.com/wp-json/oembed/1.0/embed>; rel="alternate"; type="application/json+oembed"'
      const headers = createHeaders(value)
      const expected = new Set(['https://example.com/feed'])

      expect(extractFeedUrlsFromHeaders(headers, baseUrl)).toEqual(expected)
    })
  })

  describe('deduplication', () => {
    it('should deduplicate identical URLs', () => {
      const value =
        '<https://example.com/feed.xml>; rel="alternate"; type="application/rss+xml", <https://example.com/feed.xml>; rel="alternate"; type="application/atom+xml"'
      const headers = createHeaders(value)
      const expected = new Set(['https://example.com/feed.xml'])

      expect(extractFeedUrlsFromHeaders(headers, baseUrl)).toEqual(expected)
    })
  })

  describe('invalid and edge cases', () => {
    it('should handle missing Link header', () => {
      const headers = new Headers()
      const expected = new Set()

      expect(extractFeedUrlsFromHeaders(headers, baseUrl)).toEqual(expected)
    })

    it('should handle empty Link header', () => {
      const headers = createHeaders('')
      const expected = new Set()

      expect(extractFeedUrlsFromHeaders(headers, baseUrl)).toEqual(expected)
    })

    it('should handle malformed link without angle brackets', () => {
      const value = 'https://example.com/feed.xml; rel="alternate"; type="application/rss+xml"'
      const headers = createHeaders(value)
      const expected = new Set()

      expect(extractFeedUrlsFromHeaders(headers, baseUrl)).toEqual(expected)
    })

    it('should ignore invalid URLs', () => {
      const value = '<javascript:void(0)>; rel="alternate"; type="application/rss+xml"'
      const headers = createHeaders(value)
      const expected = new Set()

      expect(extractFeedUrlsFromHeaders(headers, baseUrl)).toEqual(expected)
    })

    it('should ignore mailto URLs', () => {
      const value = '<mailto:feed@example.com>; rel="alternate"; type="application/rss+xml"'
      const headers = createHeaders(value)
      const expected = new Set()

      expect(extractFeedUrlsFromHeaders(headers, baseUrl)).toEqual(expected)
    })

    it('should ignore data URLs', () => {
      const value = '<data:text/plain,test>; rel="alternate"; type="application/rss+xml"'
      const headers = createHeaders(value)
      const expected = new Set()

      expect(extractFeedUrlsFromHeaders(headers, baseUrl)).toEqual(expected)
    })

    it('should ignore tel URLs', () => {
      const value = '<tel:+1234567890>; rel="alternate"; type="application/rss+xml"'
      const headers = createHeaders(value)
      const expected = new Set()

      expect(extractFeedUrlsFromHeaders(headers, baseUrl)).toEqual(expected)
    })
  })

  describe('real-world examples', () => {
    it('should handle WordPress site headers', () => {
      const value = `<https://brunopulis.com/wp-json/micropub/1.0/media>; rel="micropub_media", <https://brunopulis.com/wp-json/micropub/1.0/endpoint>; rel="micropub", <https://brunopulis.com/type/standard/feed/>; rel="alternate"; type="application/rss+xml"; title="Bruno Pulis > Standard Feed", <https://brunopulis.com/type/aside/feed/>; rel="alternate"; type="application/rss+xml"; title="Bruno Pulis > Aside Feed", <https://brunopulis.com/feed/>; rel="alternate"; type="application/rss+xml"; title="Bruno Pulis > Main Feed"`
      const headers = createHeaders(value)
      const expected = new Set([
        'https://brunopulis.com/type/standard/feed/',
        'https://brunopulis.com/type/aside/feed/',
        'https://brunopulis.com/feed/',
      ])

      expect(extractFeedUrlsFromHeaders(headers, baseUrl)).toEqual(expected)
    })

    it('should handle mixed feed types', () => {
      const value = `<https://example.com/rss.xml>; rel="alternate"; type="application/rss+xml", <https://example.com/atom.xml>; rel="alternate"; type="application/atom+xml", <https://example.com/feed.json>; rel="alternate"; type="application/json"`
      const headers = createHeaders(value)
      const expected = new Set([
        'https://example.com/rss.xml',
        'https://example.com/atom.xml',
        'https://example.com/feed.json',
      ])

      expect(extractFeedUrlsFromHeaders(headers, baseUrl)).toEqual(expected)
    })
  })
})
