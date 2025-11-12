import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import {
  isAbsoluteUrl,
  isOneOfDomains,
  isSafePublicUrl,
  isSimilarUrl,
  prepareUrl,
  resolveNonStandardFeedUrl,
  resolveProtocolRelativeUrl,
  validateUrl,
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
    '/images/logo.png',
    'subdir/file.html',
    '../parent.txt',
    './current-dir.md',
    'file.txt',
    '',
    '   ',
  ]

  const protocolRelativeCases = ['//cdn.example.com/style.css', '//example.com/feed.xml']

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

  for (const url of protocolRelativeCases) {
    it(`should treat protocol-relative URL as absolute: ${url}`, () => {
      expect(isAbsoluteUrl(url)).toBe(true)
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
    // Temporarily disable the unsafe flag to test actual SSRF protection.
    const originalEnv = process.env.UNSAFE_DISABLE_SSRF_CHECK

    beforeEach(() => {
      process.env.UNSAFE_DISABLE_SSRF_CHECK = ''
    })

    afterEach(() => {
      process.env.UNSAFE_DISABLE_SSRF_CHECK = originalEnv ?? ''
    })

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

describe('resolveProtocolRelativeUrl', () => {
  describe('Valid protocol-relative URLs', () => {
    const validCases = [
      { input: '//example.com/feed', expected: 'https://example.com/feed' },
      { input: '//cdn.example.com/style.css', expected: 'https://cdn.example.com/style.css' },
      { input: '//localhost/api', expected: 'https://localhost/api' },
      { input: '//192.168.1.1/api', expected: 'https://192.168.1.1/api' },
      { input: '//example.com:8080/feed', expected: 'https://example.com:8080/feed' },
    ]

    for (const { input, expected } of validCases) {
      it(`should convert ${input} to ${expected}`, () => {
        expect(resolveProtocolRelativeUrl(input)).toBe(expected)
      })
    }
  })

  describe('Custom protocol parameter', () => {
    it('should use http when specified', () => {
      const value = '//example.com/feed'
      const expected = 'http://example.com/feed'

      expect(resolveProtocolRelativeUrl(value, 'http')).toBe(expected)
    })

    it('should default to https when not specified', () => {
      const value = '//example.com/feed'
      const expected = 'https://example.com/feed'

      expect(resolveProtocolRelativeUrl(value)).toBe(expected)
    })
  })

  describe('Invalid protocol-relative URLs (file paths)', () => {
    const invalidCases = [
      '//Users/file.xml',
      '//home/user/file.txt',
      '///triple-slash',
      '/single-slash',
      'https://example.com',
      'example.com',
    ]

    for (const input of invalidCases) {
      it(`should return ${input} unchanged`, () => {
        expect(resolveProtocolRelativeUrl(input)).toBe(input)
      })
    }
  })

  describe('Edge cases', () => {
    it('should handle single-word hostname', () => {
      const value = '//singlelabel'
      expect(resolveProtocolRelativeUrl(value)).toBe(value)
    })

    it('should handle IPv6 addresses', () => {
      const value = '//[2001:db8::1]/path'
      // IPv6 addresses need brackets which don't contain dots, so treated as single-label hostname.
      expect(resolveProtocolRelativeUrl(value)).toBe(value)
    })

    it('should handle malformed URLs gracefully', () => {
      const value = '//not valid url $#@'
      expect(resolveProtocolRelativeUrl(value)).toBe(value)
    })
  })
})

describe('validateUrl', () => {
  describe('Valid URLs', () => {
    const validUrls = [
      'https://example.com',
      'https://example.com/feed.xml',
      'https://example.com/feed?a=1&b=2',
      'https://8.8.8.8',
      'https://example.com:8080/api',
    ]

    for (const url of validUrls) {
      it(`should validate: ${url}`, () => {
        expect(validateUrl(url)).toBe(true)
      })
    }
  })

  describe('SSRF unsafe URLs', () => {
    const unsafeUrls = [
      'http://localhost',
      'http://127.0.0.1',
      'http://10.0.0.1',
      'http://192.168.1.1',
      'http://169.254.169.254',
    ]

    for (const url of unsafeUrls) {
      it(`should reject unsafe URL: ${url}`, () => {
        expect(validateUrl(url)).toBe(false)
      })
    }
  })

  describe('URL length limits', () => {
    it('should reject URLs longer than 2048 characters', () => {
      const longUrl = `https://example.com/${'a'.repeat(2050)}`

      expect(validateUrl(longUrl)).toBe(false)
    })

    it('should accept URLs at exactly 2048 characters', () => {
      const exactUrl = `https://example.com/${'a'.repeat(2028)}`

      expect(validateUrl(exactUrl)).toBe(true)
    })

    it('should accept URLs under 2048 characters', () => {
      const shortUrl = 'https://example.com/feed'

      expect(validateUrl(shortUrl)).toBe(true)
    })
  })

  describe('Query parameter limits', () => {
    it('should reject URLs with more than 50 query parameters', () => {
      const params = Array.from({ length: 51 }, (_, i) => `param${i}=value${i}`).join('&')
      const url = `https://example.com/feed?${params}`

      expect(validateUrl(url)).toBe(false)
    })

    it('should accept URLs with exactly 50 query parameters', () => {
      const params = Array.from({ length: 50 }, (_, i) => `param${i}=value${i}`).join('&')
      const url = `https://example.com/feed?${params}`

      expect(validateUrl(url)).toBe(true)
    })

    it('should accept URLs with fewer than 50 query parameters', () => {
      const url = 'https://example.com/feed?a=1&b=2&c=3'

      expect(validateUrl(url)).toBe(true)
    })
  })

  describe('HTML entity loop detection', () => {
    it('should reject URLs with &amp;amp; pattern', () => {
      const url = 'https://example.com/feed?x=1&amp;amp;y=2'

      expect(validateUrl(url)).toBe(false)
    })

    it('should accept URLs with single &amp;', () => {
      const url = 'https://example.com/feed?x=1&amp;y=2'

      expect(validateUrl(url)).toBe(true)
    })

    it('should accept URLs without HTML entities', () => {
      const url = 'https://example.com/feed?x=1&y=2'

      expect(validateUrl(url)).toBe(true)
    })
  })

  describe('Malformed URLs', () => {
    const malformedUrls = ['not a url', 'ftp://example.com', '', 'javascript:alert(1)']

    for (const url of malformedUrls) {
      it(`should reject malformed URL: ${url || 'empty string'}`, () => {
        expect(validateUrl(url)).toBe(false)
      })
    }
  })
})

describe('prepareUrl', () => {
  describe('HTML entity decoding', () => {
    it('should decode &amp; to &', () => {
      const input = 'https://example.com/feed?x=1&amp;y=2'
      const expected = 'https://example.com/feed?x=1&y=2'

      expect(prepareUrl(input)).toBe(expected)
    })

    it('should decode multiple HTML entities', () => {
      const input = 'https://example.com/feed?x=1&amp;y=2&amp;z=3'
      const expected = 'https://example.com/feed?x=1&y=2&z=3'

      expect(prepareUrl(input)).toBe(expected)
    })

    it('should decode HTML entity loops but reject due to validation', () => {
      const input = 'https://example.com/feed?x=1&amp;amp;amp;y=2'
      // Decodes to &&&, but validateUrl() rejects &amp;amp; pattern.
      expect(prepareUrl(input)).toBeUndefined()
    })

    it('should decode accented characters', () => {
      const input = 'https://example.com/caf&eacute;'
      const expected = 'https://example.com/caf%C3%A9'

      expect(prepareUrl(input)).toBe(expected)
    })
  })

  describe('Non-standard feed protocol resolution', () => {
    it('should convert feed:// to https://', () => {
      const input = 'feed://example.com/rss.xml'
      const expected = 'https://example.com/rss.xml'

      expect(prepareUrl(input)).toBe(expected)
    })

    it('should unwrap feed:https://', () => {
      const input = 'feed:https://example.com/rss.xml'
      const expected = 'https://example.com/rss.xml'

      expect(prepareUrl(input)).toBe(expected)
    })

    it('should convert rss:// to https://', () => {
      const input = 'rss://example.com/feed.xml'
      const expected = 'https://example.com/feed.xml'

      expect(prepareUrl(input)).toBe(expected)
    })
  })

  describe('Protocol-relative URL resolution', () => {
    it('should convert // to https://', () => {
      const input = '//example.com/feed'
      const expected = 'https://example.com/feed'

      expect(prepareUrl(input)).toBe(expected)
    })

    it('should not convert file paths starting with //', () => {
      const input = '//Users/file.xml'
      expect(prepareUrl(input)).toBeUndefined()
    })
  })

  describe('Relative URL resolution with base', () => {
    const baseUrl = 'https://example.com/base/path/'

    it('should resolve relative path', () => {
      const input = 'feed.xml'
      const expected = 'https://example.com/base/path/feed.xml'

      expect(prepareUrl(input, { base: baseUrl })).toBe(expected)
    })

    it('should resolve root-relative path', () => {
      const input = '/feed'
      const expected = 'https://example.com/feed'

      expect(prepareUrl(input, { base: baseUrl })).toBe(expected)
    })

    it('should resolve parent directory', () => {
      const input = '../../feed.xml'
      const expected = 'https://example.com/feed.xml'

      expect(prepareUrl(input, { base: baseUrl })).toBe(expected)
    })

    it('should not modify absolute URLs when base is provided', () => {
      const input = 'https://other.com/feed'
      const expected = 'https://other.com/feed'

      expect(prepareUrl(input, { base: baseUrl })).toBe(expected)
    })
  })

  describe('URL normalization', () => {
    it('should normalize URL using native URL constructor', () => {
      const input = 'https://example.com:443/./feed/../rss.xml'
      const expected = 'https://example.com/rss.xml'

      expect(prepareUrl(input)).toBe(expected)
    })

    it('should preserve query parameters', () => {
      const input = 'https://example.com/feed?a=1&b=2'
      const expected = 'https://example.com/feed?a=1&b=2'

      expect(prepareUrl(input)).toBe(expected)
    })
  })

  describe('Validation option', () => {
    it('should validate by default', () => {
      const input = 'http://localhost/feed'
      expect(prepareUrl(input)).toBeUndefined()
    })

    it('should skip validation when validate: false', () => {
      const input = 'http://localhost/feed'
      const expected = 'http://localhost/feed'

      expect(prepareUrl(input, { validate: false })).toBe(expected)
    })

    it('should decode but not validate when validate: false', () => {
      const input = 'https://example.com/feed?x=1&amp;y=2'
      const expected = 'https://example.com/feed?x=1&y=2'

      expect(prepareUrl(input, { validate: false })).toBe(expected)
    })
  })

  describe('Combined transformations', () => {
    it('should apply all transformations in order', () => {
      const input = 'feed:https://example.com/caf&eacute;?x=1&amp;y=2'
      const expected = 'https://example.com/caf%C3%A9?x=1&y=2'

      expect(prepareUrl(input)).toBe(expected)
    })

    it('should handle protocol-relative with entities and base URL', () => {
      const input = '//example.com/feed?x=1&amp;y=2'
      const expected = 'https://example.com/feed?x=1&y=2'

      expect(prepareUrl(input, { base: 'https://other.com' })).toBe(expected)
    })
  })

  describe('Invalid inputs', () => {
    it('should return undefined for invalid URL after processing', () => {
      const input = 'not a url'
      expect(prepareUrl(input)).toBeUndefined()
    })

    it('should return undefined for SSRF unsafe URL', () => {
      const input = 'https://192.168.1.1/feed'
      expect(prepareUrl(input)).toBeUndefined()
    })

    it('should return undefined for URL exceeding length limit', () => {
      const input = `https://example.com/${'a'.repeat(2050)}`
      expect(prepareUrl(input)).toBeUndefined()
    })

    it('should return undefined for relative URL without base', () => {
      const input = 'relative/path'
      expect(prepareUrl(input)).toBeUndefined()
    })
  })
})

describe('isOneOfDomains', () => {
  const domains = ['facebook.com', 'twitter.com', 'linkedin.com']

  describe('Matching domains', () => {
    const matchingUrls = [
      'https://facebook.com',
      'https://www.facebook.com',
      'https://m.facebook.com/profile',
      'https://twitter.com/user',
      'https://mobile.twitter.com',
      'https://linkedin.com/in/profile',
    ]

    for (const url of matchingUrls) {
      it(`should match ${url}`, () => {
        expect(isOneOfDomains(url, domains)).toBe(true)
      })
    }
  })

  describe('Non-matching domains', () => {
    const nonMatchingUrls = [
      'https://example.com',
      'https://instagram.com',
      'https://notfacebook.com',
      'https://myfacebook.com',
      'https://example.com/facebook.com',
    ]

    for (const url of nonMatchingUrls) {
      it(`should not match ${url}`, () => {
        expect(isOneOfDomains(url, domains)).toBe(false)
      })
    }
  })

  describe('Edge cases', () => {
    it('should handle empty domains array', () => {
      const url = 'https://facebook.com'
      expect(isOneOfDomains(url, [])).toBe(false)
    })

    it('should handle malformed URL gracefully', () => {
      const url = 'not a url'
      expect(isOneOfDomains(url, domains)).toBe(false)
    })

    it('should handle URL with port', () => {
      const url = 'https://facebook.com:8080/api'
      expect(isOneOfDomains(url, domains)).toBe(true)
    })

    it('should handle URL with credentials', () => {
      const url = 'https://user:pass@facebook.com/page'
      expect(isOneOfDomains(url, domains)).toBe(true)
    })

    it('should match exact domain case-insensitively', () => {
      const url = 'https://Facebook.com'
      const lowerDomains = ['facebook.com']
      // URL constructor normalizes hostname to lowercase.
      expect(isOneOfDomains(url, lowerDomains)).toBe(true)
    })
  })
})
