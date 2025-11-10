import { describe, expect, it } from 'vitest'
import { extractRedirectUrl } from './redirectPage.ts'

describe('extractRedirectUrl', () => {
  it('extracts URL from double-quoted attributes', () => {
    const html = '<meta http-equiv="refresh" content="0;url=http://example.com">'
    const expected = 'http://example.com'

    expect(extractRedirectUrl(html)).toBe(expected)
  })

  it('extracts URL from single-quoted attributes', () => {
    const html = "<meta http-equiv='refresh' content='0; url=http://example.com'>"
    const expected = 'http://example.com'

    expect(extractRedirectUrl(html)).toBe(expected)
  })

  it('extracts URL from unquoted attributes', () => {
    const html = '<meta http-equiv=refresh content="0;url=http://example.com">'
    const expected = 'http://example.com'

    expect(extractRedirectUrl(html)).toBe(expected)
  })

  it('extracts URL when attributes are in different order', () => {
    const html = '<meta content="0; url=http://example.com" http-equiv="refresh">'
    const expected = 'http://example.com'

    expect(extractRedirectUrl(html)).toBe(expected)
  })

  it('extracts URL with different spacing patterns', () => {
    const variations = [
      '<meta http-equiv="refresh" content="0;url=http://example.com">',
      '<meta http-equiv="refresh" content="0; url=http://example.com">',
      '<meta http-equiv="refresh" content="0;  url=http://example.com">',
      '<meta http-equiv="refresh" content="0 ;url=http://example.com">',
    ]
    const expected = 'http://example.com'

    for (const html of variations) {
      expect(extractRedirectUrl(html)).toBe(expected)
    }
  })

  it('extracts URL with different delay values', () => {
    const variations = [
      '<meta http-equiv="refresh" content="0;url=http://example.com">',
      '<meta http-equiv="refresh" content="5; url=http://example.com">',
      '<meta http-equiv="refresh" content="10;url=http://example.com">',
    ]
    const expected = 'http://example.com'

    for (const html of variations) {
      expect(extractRedirectUrl(html)).toBe(expected)
    }
  })

  it('extracts URL from full HTML document', () => {
    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta http-equiv="refresh" content="0;url=http://example.com">
        <title>Redirecting...</title>
      </head>
      <body>
        <p>Redirecting to new page...</p>
      </body>
      </html>
    `
    const expected = 'http://example.com'

    expect(extractRedirectUrl(html)).toBe(expected)
  })

  it('extracts URLs with different protocols and formats', () => {
    const variations = [
      '<meta http-equiv="refresh" content="0;url=https://example.com">',
      '<meta http-equiv="refresh" content="0;url=http://sub.example.com">',
      '<meta http-equiv="refresh" content="0;url=https://example.com/path">',
      '<meta http-equiv="refresh" content="0;url=https://example.com/path?param=value">',
      '<meta http-equiv="refresh" content="0;url=https://example.com#section">',
    ]

    for (const html of variations) {
      const expected = html.match(/url=([^"'>]+)/i)?.[1]

      expect(extractRedirectUrl(html)).toBe(expected)
    }
  })

  it('returns undefined for HTML without redirect meta tag', () => {
    const variations = [
      '',
      '<html></html>',
      '<meta content="something">',
      '<meta http-equiv="content-type" content="text/html">',
    ]

    for (const html of variations) {
      expect(extractRedirectUrl(html)).toBeUndefined()
    }
  })

  it('handles malformed meta tags', () => {
    const variations = [
      '<meta http-equiv="refresh" content="0;url=">',
      '<meta http-equiv="refresh">',
      '<meta http-equiv="refresh" content="">',
      '<meta http-equiv="refresh" content="0;">',
    ]

    for (const html of variations) {
      expect(extractRedirectUrl(html)).toBeUndefined()
    }
  })

  it('handles case insensitivity', () => {
    const variations = [
      '<META HTTP-EQUIV="REFRESH" CONTENT="0;URL=http://example.com">',
      '<meta Http-Equiv="Refresh" content="0;Url=http://example.com">',
      '<meta http-equiv="refresh" content="0;URL=http://example.com">',
    ]
    const expected = 'http://example.com'

    for (const html of variations) {
      expect(extractRedirectUrl(html)).toBe(expected)
    }
  })

  describe('self-closing tags', () => {
    it('handles self-closing meta tag', () => {
      const html = '<meta http-equiv="refresh" content="0;url=http://example.com" />'
      const expected = 'http://example.com'

      expect(extractRedirectUrl(html)).toBe(expected)
    })

    it('handles self-closing tag with extra slashes', () => {
      const html = '<meta http-equiv="refresh" content="0;url=http://example.com"  //>'
      const expected = 'http://example.com'

      expect(extractRedirectUrl(html)).toBe(expected)
    })
  })

  describe('extra whitespace and formatting', () => {
    it('handles extra whitespace between attributes', () => {
      const html = '<meta  http-equiv="refresh"   content="0;url=http://example.com"   >'
      const expected = 'http://example.com'

      expect(extractRedirectUrl(html)).toBe(expected)
    })

    it('handles newlines between attributes', () => {
      const html = `<meta
        http-equiv="refresh"
        content="0;url=http://example.com"
      >`
      const expected = 'http://example.com'

      expect(extractRedirectUrl(html)).toBe(expected)
    })

    it('handles spaces around equals signs', () => {
      const html = '<meta http-equiv = "refresh" content = "0;url=http://example.com">'
      const expected = 'http://example.com'

      expect(extractRedirectUrl(html)).toBe(expected)
    })

    it('handles tabs and mixed whitespace', () => {
      const html = '<meta\thttp-equiv="refresh"\t\tcontent="0;url=http://example.com">'
      const expected = 'http://example.com'

      expect(extractRedirectUrl(html)).toBe(expected)
    })
  })

  describe('mixed quotes', () => {
    it('handles mixed single and double quotes', () => {
      const html = '<meta http-equiv="refresh" content=\'0;url=http://example.com\'>'
      const expected = 'http://example.com'

      expect(extractRedirectUrl(html)).toBe(expected)
    })

    it('handles unquoted content with quoted URL', () => {
      const html = '<meta http-equiv=refresh content="0;url=http://example.com">'
      const expected = 'http://example.com'

      expect(extractRedirectUrl(html)).toBe(expected)
    })
  })

  describe('meta tag with extra attributes', () => {
    it('handles meta tag with charset attribute', () => {
      const html = '<meta charset="utf-8" http-equiv="refresh" content="0;url=http://example.com">'
      const expected = 'http://example.com'

      expect(extractRedirectUrl(html)).toBe(expected)
    })

    it('handles meta tag with name attribute', () => {
      const html = '<meta name="viewport" http-equiv="refresh" content="0;url=http://example.com">'
      const expected = 'http://example.com'

      expect(extractRedirectUrl(html)).toBe(expected)
    })

    it('handles meta tag with id and class', () => {
      const html =
        '<meta id="redirect" class="auto-redirect" http-equiv="refresh" content="0;url=http://example.com">'
      const expected = 'http://example.com'

      expect(extractRedirectUrl(html)).toBe(expected)
    })
  })

  describe('URL variations', () => {
    it('handles relative URLs', () => {
      const html = '<meta http-equiv="refresh" content="0;url=/path/to/page">'
      const expected = '/path/to/page'

      expect(extractRedirectUrl(html)).toBe(expected)
    })

    it('handles protocol-relative URLs', () => {
      const html = '<meta http-equiv="refresh" content="0;url=//example.com/path">'
      const expected = '//example.com/path'

      expect(extractRedirectUrl(html)).toBe(expected)
    })

    it('handles URL with port', () => {
      const html = '<meta http-equiv="refresh" content="0;url=http://example.com:8080/path">'
      const expected = 'http://example.com:8080/path'

      expect(extractRedirectUrl(html)).toBe(expected)
    })

    it('handles URL with authentication', () => {
      const html = '<meta http-equiv="refresh" content="0;url=http://user:pass@example.com">'
      const expected = 'http://user:pass@example.com'

      expect(extractRedirectUrl(html)).toBe(expected)
    })

    it('handles URL with fragment', () => {
      const html = '<meta http-equiv="refresh" content="0;url=http://example.com#section">'
      const expected = 'http://example.com#section'

      expect(extractRedirectUrl(html)).toBe(expected)
    })

    it('handles URL with query parameters', () => {
      const html = '<meta http-equiv="refresh" content="0;url=http://example.com?foo=bar&baz=qux">'
      const expected = 'http://example.com?foo=bar&baz=qux'

      expect(extractRedirectUrl(html)).toBe(expected)
    })

    it('handles URL-encoded characters', () => {
      const html =
        '<meta http-equiv="refresh" content="0;url=http://example.com/path%20with%20spaces">'
      const expected = 'http://example.com/path%20with%20spaces'

      expect(extractRedirectUrl(html)).toBe(expected)
    })

    it('handles very long URLs', () => {
      const longPath = `${'/very/long/path/'.repeat(50)}page.html`
      const html = `<meta http-equiv="refresh" content="0;url=http://example.com${longPath}">`
      const expected = `http://example.com${longPath}`

      expect(extractRedirectUrl(html)).toBe(expected)
    })

    it('handles URL with special characters', () => {
      const html =
        '<meta http-equiv="refresh" content="0;url=http://example.com/path/to/page_(test).html">'
      const expected = 'http://example.com/path/to/page_(test).html'

      expect(extractRedirectUrl(html)).toBe(expected)
    })
  })

  describe('content attribute variations', () => {
    it('handles content with no delay (just semicolon)', () => {
      const html = '<meta http-equiv="refresh" content=";url=http://example.com">'
      const expected = 'http://example.com'

      expect(extractRedirectUrl(html)).toBe(expected)
    })

    it('handles uppercase URL keyword', () => {
      const html = '<meta http-equiv="refresh" content="0;URL=http://example.com">'
      const expected = 'http://example.com'

      expect(extractRedirectUrl(html)).toBe(expected)
    })

    it('handles mixed case URL keyword', () => {
      const html = '<meta http-equiv="refresh" content="0;Url=http://example.com">'
      const expected = 'http://example.com'

      expect(extractRedirectUrl(html)).toBe(expected)
    })

    it('handles content ending with closing quote', () => {
      const html = '<meta http-equiv="refresh" content="0;url=http://example.com">'
      const expected = 'http://example.com'

      expect(extractRedirectUrl(html)).toBe(expected)
    })

    it('handles content ending with single quote', () => {
      const html = "<meta http-equiv='refresh' content='0;url=http://example.com'>"
      const expected = 'http://example.com'

      expect(extractRedirectUrl(html)).toBe(expected)
    })
  })

  describe('multiple meta tags', () => {
    it('extracts URL from first meta refresh when multiple exist', () => {
      const html = `
        <meta http-equiv="refresh" content="0;url=http://first.com">
        <meta http-equiv="refresh" content="0;url=http://second.com">
      `
      const expected = 'http://first.com'

      expect(extractRedirectUrl(html)).toBe(expected)
    })

    it('ignores non-refresh meta tags and finds refresh', () => {
      const html = `
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width">
        <meta http-equiv="refresh" content="0;url=http://example.com">
        <meta name="description" content="A page">
      `
      const expected = 'http://example.com'

      expect(extractRedirectUrl(html)).toBe(expected)
    })
  })

  describe('edge cases with comments and scripts', () => {
    it('should NOT extract meta refresh from HTML comments', () => {
      const html = `
        <!-- <meta http-equiv="refresh" content="0;url=http://commented.com"> -->
        <meta http-equiv="refresh" content="0;url=http://real.com">
      `
      const expected = 'http://real.com'

      expect(extractRedirectUrl(html)).toBe(expected)
    })

    it('should NOT extract meta refresh from script tags', () => {
      const html = `
        <script>
          var html = '<meta http-equiv="refresh" content="0;url=http://fake.com">';
        </script>
        <meta http-equiv="refresh" content="0;url=http://real.com">
      `
      const expected = 'http://real.com'

      expect(extractRedirectUrl(html)).toBe(expected)
    })

    it('should NOT extract meta refresh from style tags', () => {
      const html = `
        <style>
          /* meta { content: "0;url=http://fake.com"; } */
        </style>
        <meta http-equiv="refresh" content="0;url=http://real.com">
      `
      const expected = 'http://real.com'

      expect(extractRedirectUrl(html)).toBe(expected)
    })

    it('handles multiple consecutive comments', () => {
      const html = `
        <!-- Comment 1 -->
        <!-- <meta http-equiv="refresh" content="0;url=http://old1.com"> -->
        <!-- Comment 2 -->
        <meta http-equiv="refresh" content="0;url=http://real.com">
      `
      const expected = 'http://real.com'

      expect(extractRedirectUrl(html)).toBe(expected)
    })

    it('handles mixed content with scripts, styles, and comments', () => {
      const html = `
        <!DOCTYPE html>
        <html>
        <head>
          <!-- Old redirect -->
          <script>const x = '<meta http-equiv="refresh" content="0;url=http://fake.com">';</script>
          <meta http-equiv="refresh" content="0;url=http://real.com">
          <style>/* meta { content: "fake"; } */</style>
        </head>
        <body>
          <script>console.log('<meta http-equiv="refresh" content="0;url=http://fake2.com">');</script>
        </body>
        </html>
      `
      const expected = 'http://real.com'

      expect(extractRedirectUrl(html)).toBe(expected)
    })
  })

  describe('broken or invalid HTML', () => {
    it('handles unclosed meta tag', () => {
      const html = '<meta http-equiv="refresh" content="0;url=http://example.com"'
      const expected = 'http://example.com'

      expect(extractRedirectUrl(html)).toBe(expected)
    })

    it('handles meta tag without closing bracket', () => {
      const html = '<meta http-equiv="refresh" content="0;url=http://example.com"'
      const expected = 'http://example.com'

      expect(extractRedirectUrl(html)).toBe(expected)
    })

    it('handles content attribute with unclosed quote', () => {
      const html = '<meta http-equiv="refresh" content="0;url=http://example.com>'
      const expected = 'http://example.com'

      expect(extractRedirectUrl(html)).toBe(expected)
    })
  })

  describe('empty and edge values', () => {
    it('handles empty string', () => {
      const html = ''

      expect(extractRedirectUrl(html)).toBeUndefined()
    })

    it('handles whitespace only', () => {
      const html = '   \n\t  '

      expect(extractRedirectUrl(html)).toBeUndefined()
    })

    it('handles meta refresh with empty URL', () => {
      const html = '<meta http-equiv="refresh" content="0;url=">'

      expect(extractRedirectUrl(html)).toBeUndefined()
    })

    it('handles meta refresh with just whitespace URL', () => {
      const html = '<meta http-equiv="refresh" content="0;url=   ">'

      expect(extractRedirectUrl(html)).toBeUndefined()
    })
  })

  describe('real-world examples', () => {
    it('handles typical redirect page', () => {
      const html = `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <meta http-equiv="refresh" content="5;url=https://newsite.com/page">
          <title>Page Moved</title>
        </head>
        <body>
          <h1>This page has moved</h1>
          <p>You will be redirected in 5 seconds...</p>
        </body>
        </html>
      `
      const expected = 'https://newsite.com/page'

      expect(extractRedirectUrl(html)).toBe(expected)
    })

    it('handles instant redirect (0 delay)', () => {
      const html = `
        <html>
        <head>
          <meta http-equiv="refresh" content="0;url=https://example.com/new-location">
        </head>
        </html>
      `
      const expected = 'https://example.com/new-location'

      expect(extractRedirectUrl(html)).toBe(expected)
    })

    it('handles redirect with relative path', () => {
      const html = '<meta http-equiv="refresh" content="0;url=../moved.html">'
      const expected = '../moved.html'

      expect(extractRedirectUrl(html)).toBe(expected)
    })
  })
})
