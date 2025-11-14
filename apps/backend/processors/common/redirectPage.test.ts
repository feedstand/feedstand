import { describe, expect, it } from 'vitest'
import { extractRedirectUrl } from './redirectPage.ts'

describe('extractRedirectUrl', () => {
  it('should extract URL from double-quoted attributes', () => {
    const value = '<meta http-equiv="refresh" content="0;url=http://example.com">'
    const expected = 'http://example.com'

    expect(extractRedirectUrl(value)).toBe(expected)
  })

  it('should extract URL from single-quoted attributes', () => {
    const value = "<meta http-equiv='refresh' content='0; url=http://example.com'>"
    const expected = 'http://example.com'

    expect(extractRedirectUrl(value)).toBe(expected)
  })

  it('should extract URL from unquoted attributes', () => {
    const value = '<meta http-equiv=refresh content="0;url=http://example.com">'
    const expected = 'http://example.com'

    expect(extractRedirectUrl(value)).toBe(expected)
  })

  it('should extract URL when attributes are in different order', () => {
    const value = '<meta content="0; url=http://example.com" http-equiv="refresh">'
    const expected = 'http://example.com'

    expect(extractRedirectUrl(value)).toBe(expected)
  })

  it('should extract URL with different spacing patterns', () => {
    const variations = [
      '<meta http-equiv="refresh" content="0;url=http://example.com">',
      '<meta http-equiv="refresh" content="0; url=http://example.com">',
      '<meta http-equiv="refresh" content="0;  url=http://example.com">',
      '<meta http-equiv="refresh" content="0 ;url=http://example.com">',
    ]
    const expected = 'http://example.com'

    for (const value of variations) {
      expect(extractRedirectUrl(value)).toBe(expected)
    }
  })

  it('should extract URL with different delay values', () => {
    const variations = [
      '<meta http-equiv="refresh" content="0;url=http://example.com">',
      '<meta http-equiv="refresh" content="5; url=http://example.com">',
      '<meta http-equiv="refresh" content="10;url=http://example.com">',
    ]
    const expected = 'http://example.com'

    for (const value of variations) {
      expect(extractRedirectUrl(value)).toBe(expected)
    }
  })

  it('should extract URL from full HTML document', () => {
    const value = `
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

    expect(extractRedirectUrl(value)).toBe(expected)
  })

  it('should extract URLs with different protocols and formats', () => {
    const variations = [
      '<meta http-equiv="refresh" content="0;url=https://example.com">',
      '<meta http-equiv="refresh" content="0;url=http://sub.example.com">',
      '<meta http-equiv="refresh" content="0;url=https://example.com/path">',
      '<meta http-equiv="refresh" content="0;url=https://example.com/path?param=value">',
      '<meta http-equiv="refresh" content="0;url=https://example.com#section">',
    ]

    for (const value of variations) {
      const expected = value.match(/url=([^"'>]+)/i)?.[1]

      expect(extractRedirectUrl(value)).toBe(expected)
    }
  })

  it('should return undefined for HTML without redirect meta tag', () => {
    const variations = [
      '',
      '<html></html>',
      '<meta content="something">',
      '<meta http-equiv="content-type" content="text/html">',
    ]

    for (const value of variations) {
      expect(extractRedirectUrl(value)).toBeUndefined()
    }
  })

  it('handles malformed meta tags', () => {
    const variations = [
      '<meta http-equiv="refresh" content="0;url=">',
      '<meta http-equiv="refresh">',
      '<meta http-equiv="refresh" content="">',
      '<meta http-equiv="refresh" content="0;">',
    ]

    for (const value of variations) {
      expect(extractRedirectUrl(value)).toBeUndefined()
    }
  })

  it('handles case insensitivity for http-equiv attribute', () => {
    const variations = [
      '<META HTTP-EQUIV="REFRESH" CONTENT="0;URL=http://example.com">',
      '<meta Http-Equiv="Refresh" content="0;Url=http://example.com">',
      '<meta http-equiv="refresh" content="0;URL=http://example.com">',
      '<meta http-equiv="REFRESH" content="0;url=http://example.com">',
      '<meta http-equiv="ReFrEsH" content="0;url=http://example.com">',
    ]
    const expected = 'http://example.com'

    for (const value of variations) {
      expect(extractRedirectUrl(value)).toBe(expected)
    }
  })

  describe('self-closing tags', () => {
    it('should handle self-closing meta tag', () => {
      const value = '<meta http-equiv="refresh" content="0;url=http://example.com" />'
      const expected = 'http://example.com'

      expect(extractRedirectUrl(value)).toBe(expected)
    })

    it('should handle self-closing tag with extra slashes', () => {
      const value = '<meta http-equiv="refresh" content="0;url=http://example.com"  //>'
      const expected = 'http://example.com'

      expect(extractRedirectUrl(value)).toBe(expected)
    })
  })

  describe('extra whitespace and formatting', () => {
    it('should handleextra whitespace between attributes', () => {
      const value = '<meta  http-equiv="refresh"   content="0;url=http://example.com"   >'
      const expected = 'http://example.com'

      expect(extractRedirectUrl(value)).toBe(expected)
    })

    it('should handlenewlines between attributes', () => {
      const value = `<meta
        http-equiv="refresh"
        content="0;url=http://example.com"
      >`
      const expected = 'http://example.com'

      expect(extractRedirectUrl(value)).toBe(expected)
    })

    it('should handlespaces around equals signs', () => {
      const value = '<meta http-equiv = "refresh" content = "0;url=http://example.com">'
      const expected = 'http://example.com'

      expect(extractRedirectUrl(value)).toBe(expected)
    })

    it('should handletabs and mixed whitespace', () => {
      const value = '<meta\thttp-equiv="refresh"\t\tcontent="0;url=http://example.com">'
      const expected = 'http://example.com'

      expect(extractRedirectUrl(value)).toBe(expected)
    })
  })

  describe('mixed quotes', () => {
    it('should handlemixed single and double quotes', () => {
      const value = '<meta http-equiv="refresh" content=\'0;url=http://example.com\'>'
      const expected = 'http://example.com'

      expect(extractRedirectUrl(value)).toBe(expected)
    })

    it('should handleunquoted content with quoted URL', () => {
      const value = '<meta http-equiv=refresh content="0;url=http://example.com">'
      const expected = 'http://example.com'

      expect(extractRedirectUrl(value)).toBe(expected)
    })
  })

  describe('meta tag with extra attributes', () => {
    it('should handlemeta tag with charset attribute', () => {
      const value = '<meta charset="utf-8" http-equiv="refresh" content="0;url=http://example.com">'
      const expected = 'http://example.com'

      expect(extractRedirectUrl(value)).toBe(expected)
    })

    it('should handlemeta tag with name attribute', () => {
      const value = '<meta name="viewport" http-equiv="refresh" content="0;url=http://example.com">'
      const expected = 'http://example.com'

      expect(extractRedirectUrl(value)).toBe(expected)
    })

    it('should handlemeta tag with id and class', () => {
      const value =
        '<meta id="redirect" class="auto-redirect" http-equiv="refresh" content="0;url=http://example.com">'
      const expected = 'http://example.com'

      expect(extractRedirectUrl(value)).toBe(expected)
    })
  })

  describe('URL variations', () => {
    it('should handlerelative URLs', () => {
      const value = '<meta http-equiv="refresh" content="0;url=/path/to/page">'
      const expected = '/path/to/page'

      expect(extractRedirectUrl(value)).toBe(expected)
    })

    it('should handleprotocol-relative URLs', () => {
      const value = '<meta http-equiv="refresh" content="0;url=//example.com/path">'
      const expected = '//example.com/path'

      expect(extractRedirectUrl(value)).toBe(expected)
    })

    it('should handleURL with port', () => {
      const value = '<meta http-equiv="refresh" content="0;url=http://example.com:8080/path">'
      const expected = 'http://example.com:8080/path'

      expect(extractRedirectUrl(value)).toBe(expected)
    })

    it('should handleURL with authentication', () => {
      const value = '<meta http-equiv="refresh" content="0;url=http://user:pass@example.com">'
      const expected = 'http://user:pass@example.com'

      expect(extractRedirectUrl(value)).toBe(expected)
    })

    it('should handleURL with fragment', () => {
      const value = '<meta http-equiv="refresh" content="0;url=http://example.com#section">'
      const expected = 'http://example.com#section'

      expect(extractRedirectUrl(value)).toBe(expected)
    })

    it('should handleURL with query parameters', () => {
      const value = '<meta http-equiv="refresh" content="0;url=http://example.com?foo=bar&baz=qux">'
      const expected = 'http://example.com?foo=bar&baz=qux'

      expect(extractRedirectUrl(value)).toBe(expected)
    })

    it('should handleURL-encoded characters', () => {
      const value =
        '<meta http-equiv="refresh" content="0;url=http://example.com/path%20with%20spaces">'
      const expected = 'http://example.com/path%20with%20spaces'

      expect(extractRedirectUrl(value)).toBe(expected)
    })

    it('should handlevery long URLs', () => {
      const longPath = `${'/very/long/path/'.repeat(50)}page.html`
      const value = `<meta http-equiv="refresh" content="0;url=http://example.com${longPath}">`
      const expected = `http://example.com${longPath}`

      expect(extractRedirectUrl(value)).toBe(expected)
    })

    it('should handleURL with special characters', () => {
      const value =
        '<meta http-equiv="refresh" content="0;url=http://example.com/path/to/page_(test).html">'
      const expected = 'http://example.com/path/to/page_(test).html'

      expect(extractRedirectUrl(value)).toBe(expected)
    })
  })

  describe('content attribute variations', () => {
    it('should handlecontent with no delay (just semicolon)', () => {
      const value = '<meta http-equiv="refresh" content=";url=http://example.com">'
      const expected = 'http://example.com'

      expect(extractRedirectUrl(value)).toBe(expected)
    })

    it('should handleuppercase URL keyword', () => {
      const value = '<meta http-equiv="refresh" content="0;URL=http://example.com">'
      const expected = 'http://example.com'

      expect(extractRedirectUrl(value)).toBe(expected)
    })

    it('should handlemixed case URL keyword', () => {
      const value = '<meta http-equiv="refresh" content="0;Url=http://example.com">'
      const expected = 'http://example.com'

      expect(extractRedirectUrl(value)).toBe(expected)
    })

    it('should handlecontent ending with closing quote', () => {
      const value = '<meta http-equiv="refresh" content="0;url=http://example.com">'
      const expected = 'http://example.com'

      expect(extractRedirectUrl(value)).toBe(expected)
    })

    it('should handlecontent ending with single quote', () => {
      const value = "<meta http-equiv='refresh' content='0;url=http://example.com'>"
      const expected = 'http://example.com'

      expect(extractRedirectUrl(value)).toBe(expected)
    })
  })

  describe('multiple meta tags', () => {
    it('should extract URL from first meta refresh when multiple exist', () => {
      const value = `
        <meta http-equiv="refresh" content="0;url=http://first.com">
        <meta http-equiv="refresh" content="0;url=http://second.com">
      `
      const expected = 'http://first.com'

      expect(extractRedirectUrl(value)).toBe(expected)
    })

    it('ignores non-refresh meta tags and finds refresh', () => {
      const value = `
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width">
        <meta http-equiv="refresh" content="0;url=http://example.com">
        <meta name="description" content="A page">
      `
      const expected = 'http://example.com'

      expect(extractRedirectUrl(value)).toBe(expected)
    })
  })

  describe('edge cases with comments and scripts', () => {
    it('should NOT extract meta refresh from HTML comments', () => {
      const value = `
        <!-- <meta http-equiv="refresh" content="0;url=http://commented.com"> -->
        <meta http-equiv="refresh" content="0;url=http://real.com">
      `
      const expected = 'http://real.com'

      expect(extractRedirectUrl(value)).toBe(expected)
    })

    it('should NOT extract meta refresh from script tags', () => {
      const value = `
        <script>
          var html = '<meta http-equiv="refresh" content="0;url=http://fake.com">';
        </script>
        <meta http-equiv="refresh" content="0;url=http://real.com">
      `
      const expected = 'http://real.com'

      expect(extractRedirectUrl(value)).toBe(expected)
    })

    it('should NOT extract meta refresh from style tags', () => {
      const value = `
        <style>
          /* meta { content: "0;url=http://fake.com"; } */
        </style>
        <meta http-equiv="refresh" content="0;url=http://real.com">
      `
      const expected = 'http://real.com'

      expect(extractRedirectUrl(value)).toBe(expected)
    })

    it('should handlemultiple consecutive comments', () => {
      const value = `
        <!-- Comment 1 -->
        <!-- <meta http-equiv="refresh" content="0;url=http://old1.com"> -->
        <!-- Comment 2 -->
        <meta http-equiv="refresh" content="0;url=http://real.com">
      `
      const expected = 'http://real.com'

      expect(extractRedirectUrl(value)).toBe(expected)
    })

    it('should handlemixed content with scripts, styles, and comments', () => {
      const value = `
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

      expect(extractRedirectUrl(value)).toBe(expected)
    })
  })

  describe('broken or invalid HTML', () => {
    it('should handlemalformed meta tags', () => {
      const cases = [
        '<meta http-equiv="refresh" content="0;url=http://example.com"',
        '<meta http-equiv="refresh" content="0;url=http://example.com>',
      ]

      for (const value of cases) {
        expect(extractRedirectUrl(value)).toBeUndefined()
      }
    })
  })

  describe('empty and edge values', () => {
    it('should handleempty string', () => {
      const value = ''

      expect(extractRedirectUrl(value)).toBeUndefined()
    })

    it('should handlewhitespace only', () => {
      const value = '   \n\t  '

      expect(extractRedirectUrl(value)).toBeUndefined()
    })

    it('should handlemeta refresh with empty URL', () => {
      const value = '<meta http-equiv="refresh" content="0;url=">'

      expect(extractRedirectUrl(value)).toBeUndefined()
    })

    it('should handlemeta refresh with just whitespace URL', () => {
      const value = '<meta http-equiv="refresh" content="0;url=   ">'

      expect(extractRedirectUrl(value)).toBeUndefined()
    })
  })

  describe('real-world examples', () => {
    it('should handletypical redirect page', () => {
      const value = `
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

      expect(extractRedirectUrl(value)).toBe(expected)
    })

    it('should handleinstant redirect (0 delay)', () => {
      const value = `
        <html>
        <head>
          <meta http-equiv="refresh" content="0;url=https://example.com/new-location">
        </head>
        </html>
      `
      const expected = 'https://example.com/new-location'

      expect(extractRedirectUrl(value)).toBe(expected)
    })

    it('should handle redirect with relative path', () => {
      const value = '<meta http-equiv="refresh" content="0;url=../moved.html">'
      const expected = '../moved.html'

      expect(extractRedirectUrl(value)).toBe(expected)
    })
  })
})
