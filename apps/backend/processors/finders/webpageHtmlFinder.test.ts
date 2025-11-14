import { describe, expect, it } from 'vitest'
import { extractFeedUrls } from './webpageHtmlFinder.ts'

describe('extractFeedUrls', () => {
  const baseUrl = 'https://example.com'

  describe('link elements', () => {
    it('should find RSS feed link', () => {
      const value = '<link rel="alternate" type="application/rss+xml" href="/feed.xml">'
      const expected = new Set(['https://example.com/feed.xml'])

      expect(extractFeedUrls(value, baseUrl)).toEqual(expected)
    })

    it('should find Atom feed link', () => {
      const value = '<link rel="alternate" type="application/atom+xml" href="/atom.xml">'
      const expected = new Set(['https://example.com/atom.xml'])

      expect(extractFeedUrls(value, baseUrl)).toEqual(expected)
    })

    it('should find JSON feed link', () => {
      const value = '<link rel="alternate" type="application/json" href="/feed.json">'
      const expected = new Set(['https://example.com/feed.json'])

      expect(extractFeedUrls(value, baseUrl)).toEqual(expected)
    })

    it('should find multiple link elements', () => {
      const value = `
        <link rel="alternate" type="application/rss+xml" href="/rss.xml">
        <link rel="alternate" type="application/atom+xml" href="/atom.xml">
      `
      const expected = new Set(['https://example.com/rss.xml', 'https://example.com/atom.xml'])

      expect(extractFeedUrls(value, baseUrl)).toEqual(expected)
    })

    it('should ignore link without rel="alternate"', () => {
      const value = '<link type="application/rss+xml" href="/feed.xml">'
      const expected = new Set()

      expect(extractFeedUrls(value, baseUrl)).toEqual(expected)
    })

    it('should ignore link without feed type', () => {
      const value = '<link rel="alternate" type="text/html" href="/page.html">'
      const expected = new Set()

      expect(extractFeedUrls(value, baseUrl)).toEqual(expected)
    })
  })

  describe('anchor elements', () => {
    it('should find anchor with /feed URI', () => {
      const value = '<a href="/feed">RSS Feed</a>'
      const expected = new Set(['https://example.com/feed'])

      expect(extractFeedUrls(value, baseUrl)).toEqual(expected)
    })

    it('should find anchor with /rss.xml URI', () => {
      const value = '<a href="/rss.xml">RSS</a>'
      const expected = new Set(['https://example.com/rss.xml'])

      expect(extractFeedUrls(value, baseUrl)).toEqual(expected)
    })

    it('should find anchor with /atom.xml URI', () => {
      const value = '<a href="/atom.xml">Atom</a>'
      const expected = new Set(['https://example.com/atom.xml'])

      expect(extractFeedUrls(value, baseUrl)).toEqual(expected)
    })

    it('should find anchor with /.rss URI (Reddit-style)', () => {
      const value = '<a href="/.rss">Reddit RSS</a>'
      const expected = new Set(['https://example.com/.rss'])

      expect(extractFeedUrls(value, baseUrl)).toEqual(expected)
    })

    it('should find anchor with query parameter feed', () => {
      const value = '<a href="/?feed=rss">WordPress RSS</a>'
      const expected = new Set(['https://example.com/?feed=rss'])

      expect(extractFeedUrls(value, baseUrl)).toEqual(expected)
    })

    it('should find /index.xml anchor', () => {
      const value = '<a href="/index.xml">Index</a>'
      const expected = new Set(['https://example.com/index.xml'])

      expect(extractFeedUrls(value, baseUrl)).toEqual(expected)
    })

    it('should find /feed.rss anchor', () => {
      const value = '<a href="/feed.rss">Feed RSS</a>'
      const expected = new Set(['https://example.com/feed.rss'])

      expect(extractFeedUrls(value, baseUrl)).toEqual(expected)
    })

    it('should find /feed.atom anchor', () => {
      const value = '<a href="/feed.atom">Feed Atom</a>'
      const expected = new Set(['https://example.com/feed.atom'])

      expect(extractFeedUrls(value, baseUrl)).toEqual(expected)
    })

    it('should find /?rss=1 (Textpattern)', () => {
      const value = '<a href="/?rss=1">RSS</a>'
      const expected = new Set(['https://example.com/?rss=1'])

      expect(extractFeedUrls(value, baseUrl)).toEqual(expected)
    })

    it('should find /?atom=1 (Textpattern)', () => {
      const value = '<a href="/?atom=1">Atom</a>'
      const expected = new Set(['https://example.com/?atom=1'])

      expect(extractFeedUrls(value, baseUrl)).toEqual(expected)
    })

    it('should find /feed.json anchor', () => {
      const value = '<a href="/feed.json">JSON Feed</a>'
      const expected = new Set(['https://example.com/feed.json'])

      expect(extractFeedUrls(value, baseUrl)).toEqual(expected)
    })

    it('should find multiple anchor elements', () => {
      const value = `
        <a href="/feed">Feed</a>
        <a href="/rss.xml">RSS</a>
        <a href="/atom.xml">Atom</a>
      `
      const expected = new Set([
        'https://example.com/feed',
        'https://example.com/rss.xml',
        'https://example.com/atom.xml',
      ])

      expect(extractFeedUrls(value, baseUrl)).toEqual(expected)
    })

    it('should match anchor by href suffix', () => {
      const value = '<a href="/blog/feed">Blog Feed</a>'
      const expected = new Set(['https://example.com/blog/feed'])

      expect(extractFeedUrls(value, baseUrl)).toEqual(expected)
    })

    it('should not match anchor if URI not at end', () => {
      const value = '<a href="/feed/comments">Comments</a>'
      const expected = new Set()

      expect(extractFeedUrls(value, baseUrl)).toEqual(expected)
    })

    it('should find feed at various subpaths', () => {
      const value = `
        <a href="/blog/rss.xml">Blog RSS</a>
        <a href="/news/atom.xml">News Atom</a>
        <a href="/posts/index.xml">Posts</a>
      `
      const expected = new Set([
        'https://example.com/blog/rss.xml',
        'https://example.com/news/atom.xml',
        'https://example.com/posts/index.xml',
      ])

      expect(extractFeedUrls(value, baseUrl)).toEqual(expected)
    })

    it('should handle WordPress category feeds', () => {
      const value = '<a href="/category/tech/feed">Category Feed</a>'
      const expected = new Set(['https://example.com/category/tech/feed'])

      expect(extractFeedUrls(value, baseUrl)).toEqual(expected)
    })

    it('should NOT match uppercase feed URIs (case sensitive paths)', () => {
      const value = '<a href="/FEED">Feed</a>'
      const expected = new Set()

      expect(extractFeedUrls(value, baseUrl)).toEqual(expected)
    })

    it('should NOT match feed with fragment identifier', () => {
      const value = '<a href="/feed#main">Feed</a>'
      const expected = new Set()

      expect(extractFeedUrls(value, baseUrl)).toEqual(expected)
    })

    it('should NOT match feed with query parameters after', () => {
      const value = '<a href="/feed?param=value">Feed</a>'
      const expected = new Set()

      expect(extractFeedUrls(value, baseUrl)).toEqual(expected)
    })
  })

  describe('combined link and anchor elements', () => {
    it('should find both link and anchor elements', () => {
      const value = `
        <link rel="alternate" type="application/rss+xml" href="/rss.xml">
        <a href="/feed">Feed</a>
      `
      const expected = new Set(['https://example.com/rss.xml', 'https://example.com/feed'])

      expect(extractFeedUrls(value, baseUrl)).toEqual(expected)
    })

    it('should handle complex HTML document', () => {
      const value = `
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
      const expected = new Set([
        'https://example.com/feed.xml',
        'https://example.com/atom.xml',
        'https://example.com/feed',
      ])

      expect(extractFeedUrls(value, baseUrl)).toEqual(expected)
    })
  })

  describe('URL resolution', () => {
    it('should resolve relative URLs', () => {
      const value = '<link rel="alternate" type="application/rss+xml" href="feed.xml">'
      const expected = new Set(['https://example.com/feed.xml'])

      expect(extractFeedUrls(value, baseUrl)).toEqual(expected)
    })

    it('should handle protocol-relative URLs', () => {
      const value =
        '<link rel="alternate" type="application/rss+xml" href="//feeds.example.com/rss.xml">'
      const expected = new Set(['https://feeds.example.com/rss.xml'])

      expect(extractFeedUrls(value, baseUrl)).toEqual(expected)
    })

    it('should handle URL-encoded characters in href', () => {
      const value = '<a href="/my%20blog/feed">Feed</a>'
      const expected = new Set(['https://example.com/my%20blog/feed'])

      expect(extractFeedUrls(value, baseUrl)).toEqual(expected)
    })

    it('should handle absolute URLs', () => {
      const value =
        '<link rel="alternate" type="application/rss+xml" href="https://feeds.example.com/rss.xml">'
      const expected = new Set(['https://feeds.example.com/rss.xml'])

      expect(extractFeedUrls(value, baseUrl)).toEqual(expected)
    })

    it('should resolve URLs with baseUrl having path', () => {
      const value = '<link rel="alternate" type="application/rss+xml" href="feed.xml">'
      const baseUrlWithPath = 'https://example.com/blog/'
      const expected = new Set(['https://example.com/blog/feed.xml'])

      expect(extractFeedUrls(value, baseUrlWithPath)).toEqual(expected)
    })
  })

  describe('deduplication', () => {
    it('should deduplicate identical URLs', () => {
      const value = `
        <link rel="alternate" type="application/rss+xml" href="/feed.xml">
        <a href="/feed.xml">Feed</a>
      `
      const expected = new Set(['https://example.com/feed.xml'])

      expect(extractFeedUrls(value, baseUrl)).toEqual(expected)
    })

    it('should deduplicate multiple identical anchors', () => {
      const value = `
        <a href="/feed">Feed 1</a>
        <a href="/feed">Feed 2</a>
        <a href="/feed">Feed 3</a>
      `
      const expected = new Set(['https://example.com/feed'])

      expect(extractFeedUrls(value, baseUrl)).toEqual(expected)
    })
  })

  describe('invalid and ignored URIs', () => {
    it('should ignore javascript: protocol', () => {
      const value = '<a href="javascript:void(0)">/feed</a>'
      const expected = new Set()

      expect(extractFeedUrls(value, baseUrl)).toEqual(expected)
    })

    it('should ignore mailto: protocol', () => {
      const value = '<a href="mailto:feed@example.com">Feed</a>'
      const expected = new Set()

      expect(extractFeedUrls(value, baseUrl)).toEqual(expected)
    })

    it('should ignore data: protocol', () => {
      const value = '<a href="data:text/html,<html></html>">Data</a>'
      const expected = new Set()

      expect(extractFeedUrls(value, baseUrl)).toEqual(expected)
    })

    it('should ignore tel: protocol', () => {
      const value = '<a href="tel:+1234567890">Phone</a>'
      const expected = new Set()

      expect(extractFeedUrls(value, baseUrl)).toEqual(expected)
    })

    it('should ignore wp-json/oembed/ URI', () => {
      const value = '<a href="/wp-json/oembed/1.0/embed">Embed</a>'
      const expected = new Set()

      expect(extractFeedUrls(value, baseUrl)).toEqual(expected)
    })

    it('should ignore wp-json/wp/ URI', () => {
      const value = '<a href="/wp-json/wp/v2/posts">Posts</a>'
      const expected = new Set()

      expect(extractFeedUrls(value, baseUrl)).toEqual(expected)
    })

    it('should find valid feeds but ignore WordPress JSON URIs', () => {
      const value = `
        <a href="/feed">Feed</a>
        <a href="/wp-json/oembed/1.0/embed">Embed</a>
      `
      const expected = new Set(['https://example.com/feed'])

      expect(extractFeedUrls(value, baseUrl)).toEqual(expected)
    })
  })

  describe('empty and invalid inputs', () => {
    it('should handle empty HTML', () => {
      const value = ''
      const expected = new Set()

      expect(extractFeedUrls(value, baseUrl)).toEqual(expected)
    })

    it('should handle HTML with no feeds', () => {
      const value = '<html><body><p>No feeds here</p></body></html>'
      const expected = new Set()

      expect(extractFeedUrls(value, baseUrl)).toEqual(expected)
    })

    it('should handle elements with empty href', () => {
      const value = `
        <link rel="alternate" type="application/rss+xml" href="">
        <a href="">Empty</a>
      `
      const expected = new Set()

      expect(extractFeedUrls(value, baseUrl)).toEqual(expected)
    })

    it('should handle elements without href attribute', () => {
      const value = `
        <link rel="alternate" type="application/rss+xml">
        <a>No href</a>
      `
      const expected = new Set()

      expect(extractFeedUrls(value, baseUrl)).toEqual(expected)
    })
  })

  describe('attribute order and formatting', () => {
    it('should handle link with attributes in different order', () => {
      const value = '<link type="application/rss+xml" href="/feed.xml" rel="alternate">'
      const expected = new Set(['https://example.com/feed.xml'])

      expect(extractFeedUrls(value, baseUrl)).toEqual(expected)
    })

    it('should handle uppercase type attribute value', () => {
      const value = '<link rel="alternate" type="APPLICATION/RSS+XML" href="/feed.xml">'
      const expected = new Set(['https://example.com/feed.xml'])

      expect(extractFeedUrls(value, baseUrl)).toEqual(expected)
    })

    it('should handle uppercase rel attribute value', () => {
      const value = '<link rel="ALTERNATE" type="application/rss+xml" href="/feed.xml">'
      const expected = new Set(['https://example.com/feed.xml'])

      expect(extractFeedUrls(value, baseUrl)).toEqual(expected)
    })

    it('should handle mixed case attribute values', () => {
      const cases = [
        '<link rel="Alternate" type="Application/Rss+Xml" href="/feed1.xml">',
        '<link rel="aLtErNaTe" type="APPLICATION/ATOM+XML" href="/feed2.xml">',
        '<link rel="ALTERNATE" type="application/JSON" href="/feed3.json">',
      ]
      const expected = new Set([
        'https://example.com/feed1.xml',
        'https://example.com/feed2.xml',
        'https://example.com/feed3.json',
      ])

      const allValues = cases.join('\n')
      expect(extractFeedUrls(allValues, baseUrl)).toEqual(expected)
    })

    it('should handle link with extra whitespace', () => {
      const value = '<link  rel="alternate"   type="application/rss+xml"    href="/feed.xml"   >'
      const expected = new Set(['https://example.com/feed.xml'])

      expect(extractFeedUrls(value, baseUrl)).toEqual(expected)
    })

    it('should handle link with single quotes', () => {
      const value = "<link rel='alternate' type='application/rss+xml' href='/feed.xml'>"
      const expected = new Set(['https://example.com/feed.xml'])

      expect(extractFeedUrls(value, baseUrl)).toEqual(expected)
    })

    it('should handle link with mixed quotes', () => {
      const value = '<link rel="alternate" type=\'application/rss+xml\' href="/feed.xml">'
      const expected = new Set(['https://example.com/feed.xml'])

      expect(extractFeedUrls(value, baseUrl)).toEqual(expected)
    })

    it('should handle link with newlines between attributes', () => {
      const value = `<link
        rel="alternate"
        type="application/rss+xml"
        href="/feed.xml"
      >`
      const expected = new Set(['https://example.com/feed.xml'])

      expect(extractFeedUrls(value, baseUrl)).toEqual(expected)
    })

    it('should handle anchor with extra whitespace around href', () => {
      const value = '<a  href="/feed"  >RSS</a>'
      const expected = new Set(['https://example.com/feed'])

      expect(extractFeedUrls(value, baseUrl)).toEqual(expected)
    })

    it('should handle anchor with single quotes', () => {
      const value = "<a href='/rss.xml'>RSS</a>"
      const expected = new Set(['https://example.com/rss.xml'])

      expect(extractFeedUrls(value, baseUrl)).toEqual(expected)
    })

    it('should handle anchor with other attributes before href', () => {
      const value = '<a class="feed-link" title="Subscribe" href="/feed">RSS</a>'
      const expected = new Set(['https://example.com/feed'])

      expect(extractFeedUrls(value, baseUrl)).toEqual(expected)
    })

    it('should handle anchor with other attributes after href', () => {
      const value = '<a href="/feed" class="feed-link" title="Subscribe">RSS</a>'
      const expected = new Set(['https://example.com/feed'])

      expect(extractFeedUrls(value, baseUrl)).toEqual(expected)
    })

    it('should handle self-closing link tag', () => {
      const value = '<link rel="alternate" type="application/rss+xml" href="/feed.xml" />'
      const expected = new Set(['https://example.com/feed.xml'])

      expect(extractFeedUrls(value, baseUrl)).toEqual(expected)
    })

    it('should handle link with extra slashes in self-closing tag', () => {
      const value = '<link rel="alternate" type="application/rss+xml" href="/feed.xml"  //>'
      const expected = new Set(['https://example.com/feed.xml'])

      expect(extractFeedUrls(value, baseUrl)).toEqual(expected)
    })

    it('should handle uppercase attribute names', () => {
      const value = '<link REL="alternate" TYPE="application/rss+xml" HREF="/feed.xml">'
      const expected = new Set(['https://example.com/feed.xml'])

      expect(extractFeedUrls(value, baseUrl)).toEqual(expected)
    })

    it('should handle mixed case attribute names', () => {
      const value = '<link Rel="alternate" Type="application/rss+xml" Href="/feed.xml">'
      const expected = new Set(['https://example.com/feed.xml'])

      expect(extractFeedUrls(value, baseUrl)).toEqual(expected)
    })

    it('should handle attributes without quotes (invalid but common)', () => {
      const value = '<a href=/feed>RSS</a>'
      const expected = new Set(['https://example.com/feed'])

      expect(extractFeedUrls(value, baseUrl)).toEqual(expected)
    })

    it('should handle multiple links with different formatting', () => {
      const value = `
        <link rel="alternate" type="application/rss+xml" href="/rss.xml">
        <link type='application/atom+xml' rel='alternate' href='/atom.xml' />
        <link
          rel="alternate"
          type="application/json"
          href="/feed.json"
        >
      `
      const expected = new Set([
        'https://example.com/rss.xml',
        'https://example.com/atom.xml',
        'https://example.com/feed.json',
      ])

      expect(extractFeedUrls(value, baseUrl)).toEqual(expected)
    })
  })

  describe('edge cases', () => {
    it('should handle HTML with comments', () => {
      const value = `
        <!-- <link rel="alternate" type="application/rss+xml" href="/old.xml"> -->
        <link rel="alternate" type="application/rss+xml" href="/feed.xml">
      `
      const expected = new Set(['https://example.com/feed.xml'])

      expect(extractFeedUrls(value, baseUrl)).toEqual(expected)
    })

    it('should handle feeds in nested elements', () => {
      const value = `
        <div>
          <div>
            <div>
              <a href="/feed">Deep Feed</a>
            </div>
          </div>
        </div>
      `
      const expected = new Set(['https://example.com/feed'])

      expect(extractFeedUrls(value, baseUrl)).toEqual(expected)
    })
  })

  describe('real-world examples', () => {
    it('should handle WordPress site', () => {
      const value = `
        <link rel="alternate" type="application/rss+xml" href="/feed">
        <a href="/?feed=rss">RSS Feed</a>
        <a href="/?feed=rss2">RSS 2.0</a>
        <a href="/?feed=atom">Atom Feed</a>
        <a href="/comments/feed">Comments Feed</a>
      `
      const expected = new Set([
        'https://example.com/feed',
        'https://example.com/?feed=rss',
        'https://example.com/?feed=rss2',
        'https://example.com/?feed=atom',
        'https://example.com/comments/feed',
      ])

      expect(extractFeedUrls(value, baseUrl)).toEqual(expected)
    })

    it('should handle static site generator', () => {
      const value = `
        <head>
          <link rel="alternate" type="application/rss+xml" href="/rss.xml">
          <link rel="alternate" type="application/atom+xml" href="/atom.xml">
          <link rel="alternate" type="application/json" href="/feed.json">
        </head>
      `
      const expected = new Set([
        'https://example.com/rss.xml',
        'https://example.com/atom.xml',
        'https://example.com/feed.json',
      ])

      expect(extractFeedUrls(value, baseUrl)).toEqual(expected)
    })

    it('should handle Squarespace feeds', () => {
      const value = '<a href="/?format=rss">Squarespace RSS</a>'
      const expected = new Set(['https://example.com/?format=rss'])

      expect(extractFeedUrls(value, baseUrl)).toEqual(expected)
    })

    it('should handle additional feed URI patterns', () => {
      const value = `
        <a href="/index.rss">Index RSS</a>
        <a href="/index.atom">Index Atom</a>
        <a href="/feed.rss.xml">Feed RSS XML</a>
        <a href="/feed.atom.xml">Feed Atom XML</a>
        <a href="/index.rss.xml">Index RSS XML</a>
        <a href="/index.atom.xml">Index Atom XML</a>
        <a href="/f.json">F JSON</a>
        <a href="/f.rss">F RSS</a>
        <a href="/json">JSON</a>
        <a href="/.feed">Dot Feed</a>
        <a href="/?format=atom">Squarespace Atom</a>
        <a href="/?feed=rss2">WordPress RSS2</a>
      `
      const expected = new Set([
        'https://example.com/index.rss',
        'https://example.com/index.atom',
        'https://example.com/feed.rss.xml',
        'https://example.com/feed.atom.xml',
        'https://example.com/index.rss.xml',
        'https://example.com/index.atom.xml',
        'https://example.com/f.json',
        'https://example.com/f.rss',
        'https://example.com/json',
        'https://example.com/.feed',
        'https://example.com/?format=atom',
        'https://example.com/?feed=rss2',
      ])

      expect(extractFeedUrls(value, baseUrl)).toEqual(expected)
    })

    it('should handle /rss anchor (without extension)', () => {
      const value = '<a href="/rss">RSS</a>'
      const expected = new Set(['https://example.com/rss'])

      expect(extractFeedUrls(value, baseUrl)).toEqual(expected)
    })

    it('should handle /atom anchor (without extension)', () => {
      const value = '<a href="/atom">Atom</a>'
      const expected = new Set(['https://example.com/atom'])

      expect(extractFeedUrls(value, baseUrl)).toEqual(expected)
    })
  })

  describe('regex-specific edge cases', () => {
    it('should handle absolute paths ignore baseUrl path', () => {
      const value = '<a href="/feed">Feed</a>'
      const specialBaseUrl = 'https://example.com/my-blog/'
      const expected = new Set(['https://example.com/feed'])

      expect(extractFeedUrls(value, specialBaseUrl)).toEqual(expected)
    })

    it('should handle links with spaces in attributes', () => {
      const value = '<link rel = "alternate" type = "application/rss+xml" href = "/feed.xml">'
      const expected = new Set(['https://example.com/feed.xml'])

      expect(extractFeedUrls(value, baseUrl)).toEqual(expected)
    })

    it('should handle broken HTML with unclosed tags', () => {
      const value = `
        <link rel="alternate" type="application/rss+xml" href="/feed1.xml"
        <a href="/feed">Feed</a>
      `
      const expected = new Set(['https://example.com/feed1.xml'])

      expect(extractFeedUrls(value, baseUrl)).toEqual(expected)
    })

    it('should handle nested anchor tags (invalid HTML)', () => {
      const value = '<a href="/feed"><a href="/atom.xml">Feed</a></a>'
      const expected = new Set(['https://example.com/feed', 'https://example.com/atom.xml'])

      expect(extractFeedUrls(value, baseUrl)).toEqual(expected)
    })

    it('should not match links inside script tags', () => {
      const value = `
        <script>
          const value = '<link rel="alternate" type="application/rss+xml" href="/fake.xml">';
          const link = '<a href="/feed">Feed</a>';
        </script>
        <link rel="alternate" type="application/rss+xml" href="/real.xml">
      `
      const expected = new Set(['https://example.com/real.xml'])

      expect(extractFeedUrls(value, baseUrl)).toEqual(expected)
    })

    it('should not match links inside style tags', () => {
      const value = `
        <style>
          /* content: '<link rel="alternate" type="application/rss+xml" href="/fake.xml">'; */
        </style>
        <link rel="alternate" type="application/rss+xml" href="/real.xml">
      `
      const expected = new Set(['https://example.com/real.xml'])

      expect(extractFeedUrls(value, baseUrl)).toEqual(expected)
    })

    it('should handle multiple consecutive comments', () => {
      const value = `
        <!-- Comment 1 -->
        <!-- <link rel="alternate" type="application/rss+xml" href="/old1.xml"> -->
        <!-- Comment 2 -->
        <!-- <link rel="alternate" type="application/rss+xml" href="/old2.xml"> -->
        <link rel="alternate" type="application/rss+xml" href="/feed.xml">
      `
      const expected = new Set(['https://example.com/feed.xml'])

      expect(extractFeedUrls(value, baseUrl)).toEqual(expected)
    })

    it('should handle very long href values', () => {
      const longPath = `${'/very/long/path/'.repeat(50)}feed.xml`
      const value = `<link rel="alternate" type="application/rss+xml" href="${longPath}">`
      const expected = new Set([`https://example.com${longPath}`])

      expect(extractFeedUrls(value, baseUrl)).toEqual(expected)
    })

    it('should handle mixed content with scripts, styles, and comments', () => {
      const value = `
        <!DOCTYPE html>
        <html>
        <head>
          <!-- Old feed -->
          <script>const x = '<a href="/fake">Fake</a>';</script>
          <link rel="alternate" type="application/rss+xml" href="/feed.xml">
          <style>/* a[href="/fake"] { color: red; } */</style>
        </head>
        <body>
          <a href="/feed">Real Feed</a>
          <script>console.log('<link rel="alternate" href="/fake2.xml">');</script>
        </body>
        </html>
      `
      const expected = new Set(['https://example.com/feed.xml', 'https://example.com/feed'])

      expect(extractFeedUrls(value, baseUrl)).toEqual(expected)
    })
  })
})
