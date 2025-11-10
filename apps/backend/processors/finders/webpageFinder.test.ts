import { describe, expect, it } from 'vitest'
import { extractFeedUrls } from './webpageFinder.ts'

describe('extractFeedUrls', () => {
  const baseUrl = 'https://example.com'

  describe('link elements', () => {
    it('should find RSS feed link', () => {
      const html = '<link rel="alternate" type="application/rss+xml" href="/feed.xml">'
      const expected = ['https://example.com/feed.xml']

      expect(extractFeedUrls(html, baseUrl)).toEqual(expected)
    })

    it('should find Atom feed link', () => {
      const html = '<link rel="alternate" type="application/atom+xml" href="/atom.xml">'
      const expected = ['https://example.com/atom.xml']

      expect(extractFeedUrls(html, baseUrl)).toEqual(expected)
    })

    it('should find JSON feed link', () => {
      const html = '<link rel="alternate" type="application/json" href="/feed.json">'
      const expected = ['https://example.com/feed.json']

      expect(extractFeedUrls(html, baseUrl)).toEqual(expected)
    })

    it('should find multiple link elements', () => {
      const html = `
        <link rel="alternate" type="application/rss+xml" href="/rss.xml">
        <link rel="alternate" type="application/atom+xml" href="/atom.xml">
      `
      const result = extractFeedUrls(html, baseUrl)

      expect(result).toHaveLength(2)
      expect(result).toContain('https://example.com/rss.xml')
      expect(result).toContain('https://example.com/atom.xml')
    })

    it('should ignore link without rel="alternate"', () => {
      const html = '<link type="application/rss+xml" href="/feed.xml">'
      const expected = []

      expect(extractFeedUrls(html, baseUrl)).toEqual(expected)
    })

    it('should ignore link without feed type', () => {
      const html = '<link rel="alternate" type="text/html" href="/page.html">'
      const expected = []

      expect(extractFeedUrls(html, baseUrl)).toEqual(expected)
    })
  })

  describe('anchor elements', () => {
    it('should find anchor with /feed URI', () => {
      const html = '<a href="/feed">RSS Feed</a>'
      const expected = ['https://example.com/feed']

      expect(extractFeedUrls(html, baseUrl)).toEqual(expected)
    })

    it('should find anchor with /rss.xml URI', () => {
      const html = '<a href="/rss.xml">RSS</a>'
      const expected = ['https://example.com/rss.xml']

      expect(extractFeedUrls(html, baseUrl)).toEqual(expected)
    })

    it('should find anchor with /atom.xml URI', () => {
      const html = '<a href="/atom.xml">Atom</a>'
      const expected = ['https://example.com/atom.xml']

      expect(extractFeedUrls(html, baseUrl)).toEqual(expected)
    })

    it('should find anchor with /.rss URI (Reddit-style)', () => {
      const html = '<a href="/.rss">Reddit RSS</a>'
      const expected = ['https://example.com/.rss']

      expect(extractFeedUrls(html, baseUrl)).toEqual(expected)
    })

    it('should find anchor with query parameter feed', () => {
      const html = '<a href="/?feed=rss">WordPress RSS</a>'
      const expected = ['https://example.com/?feed=rss']

      expect(extractFeedUrls(html, baseUrl)).toEqual(expected)
    })

    it('should find multiple anchor elements', () => {
      const html = `
        <a href="/feed">Feed</a>
        <a href="/rss.xml">RSS</a>
        <a href="/atom.xml">Atom</a>
      `
      const result = extractFeedUrls(html, baseUrl)

      expect(result).toHaveLength(3)
      expect(result).toContain('https://example.com/feed')
      expect(result).toContain('https://example.com/rss.xml')
      expect(result).toContain('https://example.com/atom.xml')
    })

    it('should match anchor by href suffix', () => {
      const html = '<a href="/blog/feed">Blog Feed</a>'
      const expected = ['https://example.com/blog/feed']

      expect(extractFeedUrls(html, baseUrl)).toEqual(expected)
    })

    it('should not match anchor if URI not at end', () => {
      const html = '<a href="/feed/comments">Comments</a>'
      const expected = []

      expect(extractFeedUrls(html, baseUrl)).toEqual(expected)
    })
  })

  describe('combined link and anchor elements', () => {
    it('should find both link and anchor elements', () => {
      const html = `
        <link rel="alternate" type="application/rss+xml" href="/rss.xml">
        <a href="/feed">Feed</a>
      `
      const result = extractFeedUrls(html, baseUrl)

      expect(result).toHaveLength(2)
      expect(result).toContain('https://example.com/rss.xml')
      expect(result).toContain('https://example.com/feed')
    })

    it('should handle complex HTML document', () => {
      const html = `
        <!DOCTYPE html>
        <html>
          <head>
            <title>Example Blog</title>
            <link rel="alternate" type="application/rss+xml" href="/feed.xml">
            <link rel="alternate" type="application/atom+xml" href="/atom.xml">
          </head>
          <body>
            <header>
              <nav>
                <a href="/">Home</a>
                <a href="/about">About</a>
                <a href="/feed">RSS Feed</a>
              </nav>
            </header>
            <main>Content here</main>
          </body>
        </html>
      `
      const result = extractFeedUrls(html, baseUrl)

      expect(result).toHaveLength(3)
      expect(result).toContain('https://example.com/feed.xml')
      expect(result).toContain('https://example.com/atom.xml')
      expect(result).toContain('https://example.com/feed')
    })
  })

  describe('URL resolution', () => {
    it('should resolve relative URLs', () => {
      const html = '<link rel="alternate" type="application/rss+xml" href="feed.xml">'
      const expected = ['https://example.com/feed.xml']

      expect(extractFeedUrls(html, baseUrl)).toEqual(expected)
    })

    it('should resolve absolute path URLs', () => {
      const html = '<a href="/blog/feed">Feed</a>'
      const expected = ['https://example.com/blog/feed']

      expect(extractFeedUrls(html, baseUrl)).toEqual(expected)
    })

    it('should handle absolute URLs', () => {
      const html =
        '<link rel="alternate" type="application/rss+xml" href="https://feeds.example.com/rss.xml">'
      const expected = ['https://feeds.example.com/rss.xml']

      expect(extractFeedUrls(html, baseUrl)).toEqual(expected)
    })

    it('should resolve URLs with baseUrl having path', () => {
      const html = '<link rel="alternate" type="application/rss+xml" href="feed.xml">'
      const baseUrlWithPath = 'https://example.com/blog/'
      const expected = ['https://example.com/blog/feed.xml']

      expect(extractFeedUrls(html, baseUrlWithPath)).toEqual(expected)
    })
  })

  describe('deduplication', () => {
    it('should deduplicate identical URLs', () => {
      const html = `
        <link rel="alternate" type="application/rss+xml" href="/feed.xml">
        <a href="/feed.xml">Feed</a>
      `
      const expected = ['https://example.com/feed.xml']

      expect(extractFeedUrls(html, baseUrl)).toEqual(expected)
    })

    it('should deduplicate multiple identical anchors', () => {
      const html = `
        <a href="/feed">Feed 1</a>
        <a href="/feed">Feed 2</a>
        <a href="/feed">Feed 3</a>
      `
      const expected = ['https://example.com/feed']

      expect(extractFeedUrls(html, baseUrl)).toEqual(expected)
    })
  })

  describe('ignored URIs', () => {
    it('should ignore wp-json/oembed/ URI', () => {
      const html = '<a href="/wp-json/oembed/1.0/embed">Embed</a>'
      const expected = []

      expect(extractFeedUrls(html, baseUrl)).toEqual(expected)
    })

    it('should ignore wp-json/wp/ URI', () => {
      const html = '<a href="/wp-json/wp/v2/posts">Posts</a>'
      const expected = []

      expect(extractFeedUrls(html, baseUrl)).toEqual(expected)
    })

    it('should find valid feeds but ignore WordPress JSON URIs', () => {
      const html = `
        <a href="/feed">Feed</a>
        <a href="/wp-json/oembed/1.0/embed">Embed</a>
      `
      const expected = ['https://example.com/feed']

      expect(extractFeedUrls(html, baseUrl)).toEqual(expected)
    })
  })

  describe('empty and invalid inputs', () => {
    it('should handle empty HTML', () => {
      const html = ''
      const expected = []

      expect(extractFeedUrls(html, baseUrl)).toEqual(expected)
    })

    it('should handle HTML with no feeds', () => {
      const html = '<html><body><p>No feeds here</p></body></html>'
      const expected = []

      expect(extractFeedUrls(html, baseUrl)).toEqual(expected)
    })

    it('should handle elements with empty href', () => {
      const html = `
        <link rel="alternate" type="application/rss+xml" href="">
        <a href="">Empty</a>
      `
      const expected = []

      expect(extractFeedUrls(html, baseUrl)).toEqual(expected)
    })

    it('should handle elements without href attribute', () => {
      const html = `
        <link rel="alternate" type="application/rss+xml">
        <a>No href</a>
      `
      const expected = []

      expect(extractFeedUrls(html, baseUrl)).toEqual(expected)
    })
  })

  describe('attribute order and formatting', () => {
    it('should handle link with attributes in different order', () => {
      const html = '<link type="application/rss+xml" href="/feed.xml" rel="alternate">'
      const expected = ['https://example.com/feed.xml']

      expect(extractFeedUrls(html, baseUrl)).toEqual(expected)
    })

    it('should handle link with extra whitespace', () => {
      const html = '<link  rel="alternate"   type="application/rss+xml"    href="/feed.xml"   >'
      const expected = ['https://example.com/feed.xml']

      expect(extractFeedUrls(html, baseUrl)).toEqual(expected)
    })

    it('should handle link with single quotes', () => {
      const html = "<link rel='alternate' type='application/rss+xml' href='/feed.xml'>"
      const expected = ['https://example.com/feed.xml']

      expect(extractFeedUrls(html, baseUrl)).toEqual(expected)
    })

    it('should handle link with mixed quotes', () => {
      const html = '<link rel="alternate" type=\'application/rss+xml\' href="/feed.xml">'
      const expected = ['https://example.com/feed.xml']

      expect(extractFeedUrls(html, baseUrl)).toEqual(expected)
    })

    it('should handle link with newlines between attributes', () => {
      const html = `<link
        rel="alternate"
        type="application/rss+xml"
        href="/feed.xml"
      >`
      const expected = ['https://example.com/feed.xml']

      expect(extractFeedUrls(html, baseUrl)).toEqual(expected)
    })

    it('should handle anchor with extra whitespace around href', () => {
      const html = '<a  href="/feed"  >RSS</a>'
      const expected = ['https://example.com/feed']

      expect(extractFeedUrls(html, baseUrl)).toEqual(expected)
    })

    it('should handle anchor with single quotes', () => {
      const html = "<a href='/rss.xml'>RSS</a>"
      const expected = ['https://example.com/rss.xml']

      expect(extractFeedUrls(html, baseUrl)).toEqual(expected)
    })

    it('should handle anchor with other attributes before href', () => {
      const html = '<a class="feed-link" title="Subscribe" href="/feed">RSS</a>'
      const expected = ['https://example.com/feed']

      expect(extractFeedUrls(html, baseUrl)).toEqual(expected)
    })

    it('should handle anchor with other attributes after href', () => {
      const html = '<a href="/feed" class="feed-link" title="Subscribe">RSS</a>'
      const expected = ['https://example.com/feed']

      expect(extractFeedUrls(html, baseUrl)).toEqual(expected)
    })

    it('should handle self-closing link tag', () => {
      const html = '<link rel="alternate" type="application/rss+xml" href="/feed.xml" />'
      const expected = ['https://example.com/feed.xml']

      expect(extractFeedUrls(html, baseUrl)).toEqual(expected)
    })

    it('should handle link with extra slashes in self-closing tag', () => {
      const html = '<link rel="alternate" type="application/rss+xml" href="/feed.xml"  //>'
      const expected = ['https://example.com/feed.xml']

      expect(extractFeedUrls(html, baseUrl)).toEqual(expected)
    })

    it('should handle uppercase attribute names', () => {
      const html = '<link REL="alternate" TYPE="application/rss+xml" HREF="/feed.xml">'
      const expected = ['https://example.com/feed.xml']

      expect(extractFeedUrls(html, baseUrl)).toEqual(expected)
    })

    it('should handle mixed case attribute names', () => {
      const html = '<link Rel="alternate" Type="application/rss+xml" Href="/feed.xml">'
      const expected = ['https://example.com/feed.xml']

      expect(extractFeedUrls(html, baseUrl)).toEqual(expected)
    })

    it('should handle attributes without quotes (invalid but common)', () => {
      const html = '<a href=/feed>RSS</a>'
      const expected = ['https://example.com/feed']

      expect(extractFeedUrls(html, baseUrl)).toEqual(expected)
    })

    it('should handle multiple links with different formatting', () => {
      const html = `
        <link rel="alternate" type="application/rss+xml" href="/rss.xml">
        <link type='application/atom+xml' rel='alternate' href='/atom.xml' />
        <link
          rel="alternate"
          type="application/json"
          href="/feed.json"
        >
      `
      const result = extractFeedUrls(html, baseUrl)

      expect(result).toHaveLength(3)
      expect(result).toContain('https://example.com/rss.xml')
      expect(result).toContain('https://example.com/atom.xml')
      expect(result).toContain('https://example.com/feed.json')
    })
  })

  describe('edge cases', () => {
    it('should handle HTML with comments', () => {
      const html = `
        <!-- <link rel="alternate" type="application/rss+xml" href="/old.xml"> -->
        <link rel="alternate" type="application/rss+xml" href="/feed.xml">
      `
      const expected = ['https://example.com/feed.xml']

      expect(extractFeedUrls(html, baseUrl)).toEqual(expected)
    })

    it('should handle feeds in nested elements', () => {
      const html = `
        <div>
          <div>
            <div>
              <a href="/feed">Deep Feed</a>
            </div>
          </div>
        </div>
      `
      const expected = ['https://example.com/feed']

      expect(extractFeedUrls(html, baseUrl)).toEqual(expected)
    })
  })

  describe('real-world examples', () => {
    it('should handle WordPress site', () => {
      const html = `
        <link rel="alternate" type="application/rss+xml" href="/feed">
        <a href="/?feed=rss">RSS Feed</a>
        <a href="/?feed=rss2">RSS 2.0</a>
        <a href="/?feed=atom">Atom Feed</a>
        <a href="/comments/feed">Comments Feed</a>
      `
      const result = extractFeedUrls(html, baseUrl)

      expect(result.length).toBeGreaterThan(0)
      expect(result).toContain('https://example.com/feed')
    })

    it('should handle static site generator', () => {
      const html = `
        <head>
          <link rel="alternate" type="application/rss+xml" href="/rss.xml">
          <link rel="alternate" type="application/atom+xml" href="/atom.xml">
          <link rel="alternate" type="application/json" href="/feed.json">
        </head>
      `
      const result = extractFeedUrls(html, baseUrl)

      expect(result).toHaveLength(3)
      expect(result).toContain('https://example.com/rss.xml')
      expect(result).toContain('https://example.com/atom.xml')
      expect(result).toContain('https://example.com/feed.json')
    })

    it('should handle Reddit-style feeds', () => {
      const html = '<a href="/.rss">Reddit RSS</a>'
      const expected = ['https://example.com/.rss']

      expect(extractFeedUrls(html, baseUrl)).toEqual(expected)
    })

    it('should handle Squarespace feeds', () => {
      const html = '<a href="/?format=rss">Squarespace RSS</a>'
      const expected = ['https://example.com/?format=rss']

      expect(extractFeedUrls(html, baseUrl)).toEqual(expected)
    })
  })
})
