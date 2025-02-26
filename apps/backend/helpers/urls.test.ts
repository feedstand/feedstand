import { describe, expect, it } from 'vitest'
import { isAbsoluteUrl, resolveRelativeUrl } from './urls'

describe('isAbsoluteUrl', () => {
  const absoluteCases = [
    'http://example.com',
    'https://example.com/path?query=1',
    'ftp://files.example.com',
    'HTTP://EXAMPLE.COM',
    'custom-protocol://resource',
  ]

  const relativeCases = [
    '//cdn.example.com/style.css',
    '/images/logo.png',
    'subdir/file.html',
    '../parent.txt',
    './current-dir.md',
    'file.txt',
    '',
    '   ',
  ]

  absoluteCases.forEach((url) => {
    it(`should detect absolute URL: ${url}`, () => {
      expect(isAbsoluteUrl(url)).toBe(true)
    })
  })

  relativeCases.forEach((url) => {
    it(`should detect relative URL: ${url || 'empty string'}`, () => {
      expect(isAbsoluteUrl(url)).toBe(false)
    })
  })
})

describe('resolveRelativeUrl', () => {
  const baseUrl = 'https://example.com/base/path/'

  it('should return absolute URLs unchanged', () => {
    const absoluteUrls = ['https://other-domain.com/file.txt', 'ftp://files.com/archive.zip']

    absoluteUrls.forEach((url) => {
      expect(resolveRelativeUrl(url, baseUrl)).toBe(url)
    })
  })

  it('should handle protocol-relative URLs', () => {
    expect(resolveRelativeUrl('//external.com/resource', baseUrl)).toBe(
      'https://external.com/resource',
    )
  })

  it('should handle root-relative URLs', () => {
    expect(resolveRelativeUrl('/images/logo.png', baseUrl)).toBe(
      'https://example.com/images/logo.png',
    )
  })

  it('should resolve parent directory navigation', () => {
    expect(resolveRelativeUrl('../../file.txt', baseUrl)).toBe('https://example.com/file.txt')
  })

  it('should handle current directory references', () => {
    expect(resolveRelativeUrl('./config.json', baseUrl)).toBe(
      'https://example.com/base/path/config.json',
    )
  })

  it('should append query parameters and hash', () => {
    expect(resolveRelativeUrl('search?q=test#results', baseUrl)).toBe(
      'https://example.com/base/path/search?q=test#results',
    )
  })

  it('should handle empty base URL', () => {
    expect(resolveRelativeUrl('file.txt', '')).toEqual('file.txt')
  })

  it('should handle malformed base URL', () => {
    expect(resolveRelativeUrl('/test', 'http:// test.com')).toEqual('/test')
  })

  it('should preserve URL encoding', () => {
    expect(resolveRelativeUrl('path%20with%20spaces', baseUrl)).toBe(
      'https://example.com/base/path/path%20with%20spaces',
    )
  })

  it('should handle different base URL formats', () => {
    const bases = [
      'http://example.com', // Without trailing slash
      'https://example.com/blog/', // With trailing slash
      'https://user:pass@example.com', // With credentials
    ]

    const expectations = [
      ['post.html', 'http://example.com/post.html'],
      ['2024/article.md', 'https://example.com/blog/2024/article.md'],
      ['profile', 'https://user:pass@example.com/profile'],
    ]

    bases.forEach((base, index) => {
      const [input, expected] = expectations[index]
      expect(resolveRelativeUrl(input, base)).toBe(expected)
    })
  })
})
