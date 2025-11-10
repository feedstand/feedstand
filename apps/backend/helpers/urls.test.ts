import { describe, expect, it } from 'vitest'
import {
  isAbsoluteUrl,
  isSafePublicUrl,
  isSimilarUrl,
  resolveAbsoluteUrl,
  resolveNonStandardFeedUrl,
  resolveRelativeUrl,
} from './urls.ts'

describe('isAbsoluteUrl', () => {
  const validAbsoluteCases = [
    'http://example.com',
    'https://example.com/path?query=1',
    'HTTP://EXAMPLE.COM',
    'https://example.com:443/feed.xml',
    'http://example.com:8080/api',
  ]

  const invalidSchemes = [
    'ftp://files.example.com',
    'custom-protocol://resource',
    'mailto:test@example.com',
    'javascript:alert(1)',
    'data:text/plain,hello',
    'file:///etc/passwd',
    'tel:+1234567890',
    'ssh://server.com',
    'ws://websocket.example.com',
    'wss://secure-websocket.example.com',
  ]

  const relativeCases = [
    '//cdn.example.com/style.css',
    '//example.com/feed.xml',
    '/images/logo.png',
    'subdir/file.html',
    '../parent.txt',
    './current-dir.md',
    'file.txt',
    '',
    '   ',
  ]

  for (const url of validAbsoluteCases) {
    it(`should detect valid absolute HTTP/HTTPS URL: ${url}`, () => {
      expect(isAbsoluteUrl(url)).toBe(true)
    })
  }

  for (const url of invalidSchemes) {
    it(`should reject non-HTTP(S) scheme: ${url}`, () => {
      expect(isAbsoluteUrl(url)).toBe(false)
    })
  }

  for (const url of relativeCases) {
    it(`should detect relative URL: ${url || 'empty string'}`, () => {
      expect(isAbsoluteUrl(url)).toBe(false)
    })
  }
})

describe('resolveNonStandardFeedUrl', () => {
  it('should convert feed:// to https://', () => {
    const value = 'feed://example.com/rss.xml'
    const expected = 'https://example.com/rss.xml'

    expect(resolveNonStandardFeedUrl(value)).toBe(expected)
  })

  it('should convert rss:// to https://', () => {
    const value = 'rss://example.com/feed.xml'
    const expected = 'https://example.com/feed.xml'

    expect(resolveNonStandardFeedUrl(value)).toBe(expected)
  })

  it('should convert pcast:// to https://', () => {
    const value = 'pcast://example.com/podcast.xml'
    const expected = 'https://example.com/podcast.xml'

    expect(resolveNonStandardFeedUrl(value)).toBe(expected)
  })

  it('should convert itpc:// to https://', () => {
    const value = 'itpc://example.com/podcast.xml'
    const expected = 'https://example.com/podcast.xml'

    expect(resolveNonStandardFeedUrl(value)).toBe(expected)
  })

  it('should unwrap feed:https:// to https://', () => {
    const value = 'feed:https://example.com/rss.xml'
    const expected = 'https://example.com/rss.xml'

    expect(resolveNonStandardFeedUrl(value)).toBe(expected)
  })

  it('should unwrap feed:http:// to http://', () => {
    const value = 'feed:http://example.com/rss.xml'
    const expected = 'http://example.com/rss.xml'

    expect(resolveNonStandardFeedUrl(value)).toBe(expected)
  })

  it('should unwrap rss:https:// to https://', () => {
    const value = 'rss:https://example.com/feed.xml'
    const expected = 'https://example.com/feed.xml'

    expect(resolveNonStandardFeedUrl(value)).toBe(expected)
  })

  it('should return https URLs unchanged', () => {
    const value = 'https://example.com/feed.xml'
    const expected = 'https://example.com/feed.xml'

    expect(resolveNonStandardFeedUrl(value)).toBe(expected)
  })

  it('should return http URLs unchanged', () => {
    const value = 'http://example.com/rss.xml'
    const expected = 'http://example.com/rss.xml'

    expect(resolveNonStandardFeedUrl(value)).toBe(expected)
  })

  it('should return absolute path URLs unchanged', () => {
    const value = '/path/to/feed'
    const expected = '/path/to/feed'

    expect(resolveNonStandardFeedUrl(value)).toBe(expected)
  })

  it('should return relative path URLs unchanged', () => {
    const value = 'relative/feed.xml'
    const expected = 'relative/feed.xml'

    expect(resolveNonStandardFeedUrl(value)).toBe(expected)
  })

  it('should handle feed URLs with paths and query params', () => {
    const value = 'feed://example.com/path/to/feed?format=rss'
    const expected = 'https://example.com/path/to/feed?format=rss'

    expect(resolveNonStandardFeedUrl(value)).toBe(expected)
  })

  it('should handle feed URLs with ports', () => {
    const value = 'feed://example.com:8080/feed.xml'
    const expected = 'https://example.com:8080/feed.xml'

    expect(resolveNonStandardFeedUrl(value)).toBe(expected)
  })
})

describe('resolveAbsoluteUrl', () => {
  it('should convert protocol-relative URL with path to https', () => {
    const value = '//cdn.example.com/feed.xml'
    const expected = 'https://cdn.example.com/feed.xml'

    expect(resolveAbsoluteUrl(value)).toBe(expected)
  })

  it('should convert protocol-relative URL without path to https', () => {
    const value = '//example.com/api'
    const expected = 'https://example.com/api'

    expect(resolveAbsoluteUrl(value)).toBe(expected)
  })

  it('should return https URLs unchanged', () => {
    const value = 'https://example.com/feed'
    const expected = 'https://example.com/feed'

    expect(resolveAbsoluteUrl(value)).toBe(expected)
  })

  it('should return http URLs unchanged', () => {
    const value = 'http://example.com/feed'
    const expected = 'http://example.com/feed'

    expect(resolveAbsoluteUrl(value)).toBe(expected)
  })

  it('should return absolute path unchanged', () => {
    const value = '/path/to/resource'
    const expected = '/path/to/resource'

    expect(resolveAbsoluteUrl(value)).toBe(expected)
  })

  it('should return relative path unchanged', () => {
    const value = 'relative/path'
    const expected = 'relative/path'

    expect(resolveAbsoluteUrl(value)).toBe(expected)
  })

  it('should normalize feed:// (replacing protocol)', () => {
    const value = 'feed://example.com/rss.xml'
    const expected = 'https://example.com/rss.xml'

    expect(resolveAbsoluteUrl(value)).toBe(expected)
  })

  it('should normalize feed:https:// (wrapping protocol)', () => {
    const value = 'feed:https://example.com/feed.xml'
    const expected = 'https://example.com/feed.xml'

    expect(resolveAbsoluteUrl(value)).toBe(expected)
  })
})

describe('resolveRelativeUrl', () => {
  const baseUrl = 'https://example.com/base/path/'

  it('should return absolute HTTPS URL unchanged', () => {
    const value = 'https://other-domain.com/file.txt'
    const expected = 'https://other-domain.com/file.txt'

    expect(resolveRelativeUrl(value, baseUrl)).toBe(expected)
  })

  it('should return absolute HTTP URL unchanged', () => {
    const value = 'http://files.com/archive.zip'
    const expected = 'http://files.com/archive.zip'

    expect(resolveRelativeUrl(value, baseUrl)).toBe(expected)
  })

  it('should handle protocol-relative URLs', () => {
    const value = '//external.com/resource'
    const expected = 'https://external.com/resource'

    expect(resolveRelativeUrl(value, baseUrl)).toBe(expected)
  })

  it('should handle root-relative URLs', () => {
    const value = '/images/logo.png'
    const expected = 'https://example.com/images/logo.png'

    expect(resolveRelativeUrl(value, baseUrl)).toBe(expected)
  })

  it('should resolve parent directory navigation', () => {
    const value = '../../file.txt'
    const expected = 'https://example.com/file.txt'

    expect(resolveRelativeUrl(value, baseUrl)).toBe(expected)
  })

  it('should handle current directory references', () => {
    const value = './config.json'
    const expected = 'https://example.com/base/path/config.json'

    expect(resolveRelativeUrl(value, baseUrl)).toBe(expected)
  })

  it('should append query parameters and hash', () => {
    const value = 'search?q=test#results'
    const expected = 'https://example.com/base/path/search?q=test#results'

    expect(resolveRelativeUrl(value, baseUrl)).toBe(expected)
  })

  it('should handle empty base URL', () => {
    const value = 'file.txt'
    const base = ''
    const expected = 'file.txt'

    expect(resolveRelativeUrl(value, base)).toBe(expected)
  })

  it('should handle malformed base URL', () => {
    const value = '/test'
    const base = 'http:// test.com'
    const expected = '/test'

    expect(resolveRelativeUrl(value, base)).toBe(expected)
  })

  it('should preserve URL encoding', () => {
    const value = 'path%20with%20spaces'
    const expected = 'https://example.com/base/path/path%20with%20spaces'

    expect(resolveRelativeUrl(value, baseUrl)).toBe(expected)
  })

  it('should handle base URL without trailing slash', () => {
    const value = 'post.html'
    const base = 'http://example.com'
    const expected = 'http://example.com/post.html'

    expect(resolveRelativeUrl(value, base)).toBe(expected)
  })

  it('should handle base URL with trailing slash', () => {
    const value = '2024/article.md'
    const base = 'https://example.com/blog/'
    const expected = 'https://example.com/blog/2024/article.md'

    expect(resolveRelativeUrl(value, base)).toBe(expected)
  })

  it('should handle base URL with credentials', () => {
    const value = 'profile'
    const base = 'https://user:pass@example.com'
    const expected = 'https://user:pass@example.com/profile'

    expect(resolveRelativeUrl(value, base)).toBe(expected)
  })
})

describe('isSimilarUrl', () => {
  it('should match URLs with different query parameter order', () => {
    const url1 = 'https://example.com/feed?a=1&b=2'
    const url2 = 'https://example.com/feed?b=2&a=1'

    expect(isSimilarUrl(url1, url2)).toBe(true)
  })

  it('should match URLs with http vs https', () => {
    const url1 = 'http://example.com/feed.xml'
    const url2 = 'https://example.com/feed.xml'

    expect(isSimilarUrl(url1, url2)).toBe(true)
  })

  it('should match URLs with/without www', () => {
    const url1 = 'https://www.example.com/feed'
    const url2 = 'https://example.com/feed'

    expect(isSimilarUrl(url1, url2)).toBe(true)
  })

  it('should match URLs with/without trailing slash', () => {
    const url1 = 'https://example.com/feed/'
    const url2 = 'https://example.com/feed'

    expect(isSimilarUrl(url1, url2)).toBe(true)
  })

  it('should match URLs with/without hash', () => {
    const url1 = 'https://example.com/feed#section'
    const url2 = 'https://example.com/feed'

    expect(isSimilarUrl(url1, url2)).toBe(true)
  })

  it('should match URLs with all normalizable differences', () => {
    const url1 = 'http://www.example.com/feed/?b=2&a=1#top'
    const url2 = 'https://example.com/feed?a=1&b=2'

    expect(isSimilarUrl(url1, url2)).toBe(true)
  })

  it('should not match completely different URLs', () => {
    const url1 = 'https://example.com/feed'
    const url2 = 'https://other.com/feed'

    expect(isSimilarUrl(url1, url2)).toBe(false)
  })

  it('should handle malformed URL compared to valid URL', () => {
    const url1 = 'not a url'
    const url2 = 'https://example.com'

    expect(isSimilarUrl(url1, url2)).toBe(false)
  })

  it('should handle valid URL compared to malformed URL', () => {
    const url1 = 'https://example.com'
    const url2 = 'also not valid'

    expect(isSimilarUrl(url1, url2)).toBe(false)
  })

  it('should handle two malformed URLs', () => {
    const url1 = 'malformed'
    const url2 = 'also malformed'

    expect(isSimilarUrl(url1, url2)).toBe(false)
  })

  it('should handle URLs with invalid characters gracefully', () => {
    const url1 = 'https://example.com/<invalid>'
    const url2 = 'https://example.com/valid'

    expect(isSimilarUrl(url1, url2)).toBe(false)
  })
})

describe('isSafePublicUrl', () => {
  describe('Safe public URLs (should return true)', () => {
    const safeUrls = [
      'https://example.com',
      'http://example.com',
      'https://www.example.com/feed.xml',
      'https://cdn.example.com/api/feed',
      'https://subdomain.example.com:8080/path',
      'https://8.8.8.8', // Google DNS (public IP)
      'https://1.1.1.1', // Cloudflare DNS (public IP)
      'https://93.184.216.34', // Example.com IP (public)
    ]

    for (const url of safeUrls) {
      it(`should allow safe public URL: ${url}`, () => {
        expect(isSafePublicUrl(url)).toBe(true)
      })
    }
  })

  describe('Localhost and loopback (should return false)', () => {
    const localhostUrls = [
      'http://localhost',
      'http://localhost:3000',
      'https://localhost/admin',
      'http://127.0.0.1',
      'http://127.0.0.1:8080',
      'http://127.0.0.2', // Any 127.x.x.x
      'http://127.255.255.255',
      'http://[::1]', // IPv6 loopback
      'http://[0:0:0:0:0:0:0:1]', // IPv6 loopback expanded
      'http://0.0.0.0',
      'http://0.0.0.0:8080',
    ]

    for (const url of localhostUrls) {
      it(`should block localhost/loopback: ${url}`, () => {
        expect(isSafePublicUrl(url)).toBe(false)
      })
    }
  })

  describe('Private IPv4 ranges (should return false)', () => {
    const privateIpUrls = [
      // 10.0.0.0/8
      'http://10.0.0.1',
      'http://10.255.255.254',
      'http://10.1.2.3:8080/admin',

      // 172.16.0.0/12
      'http://172.16.0.1',
      'http://172.31.255.254',
      'http://172.20.10.5',

      // 192.168.0.0/16
      'http://192.168.0.1',
      'http://192.168.1.1',
      'http://192.168.255.254',

      // 169.254.0.0/16 (link-local)
      'http://169.254.0.1',
      'http://169.254.169.254', // AWS metadata
      'http://169.254.255.254',

      // Other reserved ranges
      'http://100.64.0.1', // Shared address space
      'http://192.0.0.1', // IETF protocol assignments
      'http://192.0.2.1', // TEST-NET-1
      'http://198.18.0.1', // Benchmarking
      'http://198.51.100.1', // TEST-NET-2
      'http://203.0.113.1', // TEST-NET-3
      'http://224.0.0.1', // Multicast
      'http://240.0.0.1', // Reserved
      'http://255.255.255.255', // Broadcast
    ]

    for (const url of privateIpUrls) {
      it(`should block private IP: ${url}`, () => {
        expect(isSafePublicUrl(url)).toBe(false)
      })
    }
  })

  describe('Private IPv6 addresses (should return false)', () => {
    const privateIpv6Urls = [
      'http://[fe80::1]', // Link-local
      'http://[fc00::1]', // Unique local
      'http://[fd00::1]', // Unique local
      'http://[ff00::1]', // Multicast
      'http://[::1]', // Loopback
      'http://[::]', // Unspecified
    ]

    for (const url of privateIpv6Urls) {
      it(`should block private IPv6: ${url}`, () => {
        expect(isSafePublicUrl(url)).toBe(false)
      })
    }
  })

  describe('Invalid URLs (should return false)', () => {
    const invalidUrls = [
      'ftp://example.com', // Wrong protocol
      'file:///etc/passwd', // File protocol
      'javascript:alert(1)', // JavaScript protocol
      'data:text/plain,test', // Data URL
      '', // Empty string
      'not a url', // Invalid format
    ]

    for (const url of invalidUrls) {
      it(`should reject invalid URL: ${url || 'empty string'}`, () => {
        expect(isSafePublicUrl(url)).toBe(false)
      })
    }

    // Note: ssrfcheck auto-prepends protocol to these, making them valid
    it('should accept relative path (auto-prepended with http://)', () => {
      const value = '/relative/path'

      expect(isSafePublicUrl(value)).toBe(true)
    })

    it('should accept domain without protocol (auto-prepended)', () => {
      const value = 'example.com'

      expect(isSafePublicUrl(value)).toBe(true)
    })
  })

  describe('Edge cases', () => {
    it('should allow URL with username/password to public domain', () => {
      const value = 'http://user:pass@example.com'

      expect(isSafePublicUrl(value)).toBe(true)
    })

    it('should block URL with username/password to localhost', () => {
      const value = 'http://user:pass@localhost'

      expect(isSafePublicUrl(value)).toBe(false)
    })

    it('should handle URLs with fragments', () => {
      const value = 'https://example.com/page#section'

      expect(isSafePublicUrl(value)).toBe(true)
    })

    it('should handle URLs with query parameters', () => {
      const value = 'https://example.com/feed?key=value'

      expect(isSafePublicUrl(value)).toBe(true)
    })

    it('should be case-insensitive for LOCALHOST hostname', () => {
      const value = 'http://LOCALHOST'

      expect(isSafePublicUrl(value)).toBe(false)
    })

    it('should be case-insensitive for LocalHost hostname with port', () => {
      const value = 'http://LocalHost:3000'

      expect(isSafePublicUrl(value)).toBe(false)
    })

    it('should reject IP with first octet > 255', () => {
      const value = 'http://256.1.1.1'

      expect(isSafePublicUrl(value)).toBe(false)
    })

    it('should reject IP with second octet > 255', () => {
      const value = 'http://1.256.1.1'

      expect(isSafePublicUrl(value)).toBe(false)
    })

    it('should reject IP with fourth octet > 255', () => {
      const value = 'http://192.168.1.256'

      expect(isSafePublicUrl(value)).toBe(false)
    })

    it('should allow legitimate domain starting with localhost', () => {
      const value = 'http://localhost.example.com'

      expect(isSafePublicUrl(value)).toBe(true)
    })
  })

  describe('Cloud metadata endpoints (AWS)', () => {
    it('should block AWS metadata endpoint for meta-data', () => {
      const value = 'http://169.254.169.254/latest/meta-data/'

      expect(isSafePublicUrl(value)).toBe(false)
    })

    it('should block AWS metadata endpoint for user-data', () => {
      const value = 'http://169.254.169.254/latest/user-data/'

      expect(isSafePublicUrl(value)).toBe(false)
    })
  })
})
