import { describe, expect, it } from 'vitest'
import { extractRedirectUrl } from './redirectPage.ts'

describe('extractRedirectUrl', () => {
  it('extracts URL from double-quoted attributes', () => {
    const html = '<meta http-equiv="refresh" content="0;url=http://example.com">'
    expect(extractRedirectUrl(html)).toBe('http://example.com')
  })

  it('extracts URL from single-quoted attributes', () => {
    const html = "<meta http-equiv='refresh' content='0; url=http://example.com'>"
    expect(extractRedirectUrl(html)).toBe('http://example.com')
  })

  it('extracts URL from unquoted attributes', () => {
    const html = '<meta http-equiv=refresh content="0;url=http://example.com">'
    expect(extractRedirectUrl(html)).toBe('http://example.com')
  })

  it('extracts URL when attributes are in different order', () => {
    const html = '<meta content="0; url=http://example.com" http-equiv="refresh">'
    expect(extractRedirectUrl(html)).toBe('http://example.com')
  })

  it('extracts URL with different spacing patterns', () => {
    const variations = [
      '<meta http-equiv="refresh" content="0;url=http://example.com">',
      '<meta http-equiv="refresh" content="0; url=http://example.com">',
      '<meta http-equiv="refresh" content="0;  url=http://example.com">',
      '<meta http-equiv="refresh" content="0 ;url=http://example.com">',
    ]

    for (const html of variations) {
      expect(extractRedirectUrl(html)).toBe('http://example.com')
    }
  })

  it('extracts URL with different delay values', () => {
    const variations = [
      '<meta http-equiv="refresh" content="0;url=http://example.com">',
      '<meta http-equiv="refresh" content="5; url=http://example.com">',
      '<meta http-equiv="refresh" content="10;url=http://example.com">',
    ]

    for (const html of variations) {
      expect(extractRedirectUrl(html)).toBe('http://example.com')
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

    expect(extractRedirectUrl(html)).toBe('http://example.com')
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
      const url = html.match(/url=([^"'>]+)/i)?.[1]

      expect(extractRedirectUrl(html)).toBe(url)
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

    for (const html of variations) {
      expect(extractRedirectUrl(html)).toBe('http://example.com')
    }
  })
})
