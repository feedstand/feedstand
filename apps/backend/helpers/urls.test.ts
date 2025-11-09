import { describe, expect, it } from 'vitest'
import {
  isAbsoluteUrl,
  isSafePublicUrl,
  isSimilarUrl,
  resolveAbsoluteUrl,
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
    '//cdn.example.com/style.css', // Protocol-relative
    '//example.com/feed.xml', // Protocol-relative
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

describe('resolveAbsoluteUrl', () => {
  it('should convert protocol-relative URLs to https', () => {
    expect(resolveAbsoluteUrl('//cdn.example.com/feed.xml')).toBe(
      'https://cdn.example.com/feed.xml',
    )
    expect(resolveAbsoluteUrl('//example.com/api')).toBe('https://example.com/api')
  })

  it('should return absolute URLs unchanged', () => {
    expect(resolveAbsoluteUrl('https://example.com/feed')).toBe('https://example.com/feed')
    expect(resolveAbsoluteUrl('http://example.com/feed')).toBe('http://example.com/feed')
  })

  it('should return non-protocol-relative URLs unchanged', () => {
    expect(resolveAbsoluteUrl('/path/to/resource')).toBe('/path/to/resource')
    expect(resolveAbsoluteUrl('relative/path')).toBe('relative/path')
  })
})

describe('resolveRelativeUrl', () => {
  const baseUrl = 'https://example.com/base/path/'

  it('should return absolute HTTP/HTTPS URLs unchanged', () => {
    const absoluteUrls = ['https://other-domain.com/file.txt', 'http://files.com/archive.zip']

    for (const url of absoluteUrls) {
      expect(resolveRelativeUrl(url, baseUrl)).toBe(url)
    }
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
      'http://example.com', // Without trailing slash.
      'https://example.com/blog/', // With trailing slash.
      'https://user:pass@example.com', // With credentials.
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

  it('should handle malformed URLs gracefully', () => {
    const url1 = 'not a url'
    const url2 = 'https://example.com'

    expect(isSimilarUrl(url1, url2)).toBe(false)
    expect(isSimilarUrl(url2, 'also not valid')).toBe(false)
    expect(isSimilarUrl('malformed', 'also malformed')).toBe(false)
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
      expect(isSafePublicUrl('/relative/path')).toBe(true)
    })

    it('should accept domain without protocol (auto-prepended)', () => {
      expect(isSafePublicUrl('example.com')).toBe(true)
    })
  })

  describe('Edge cases', () => {
    it('should handle URL with username/password', () => {
      expect(isSafePublicUrl('http://user:pass@example.com')).toBe(true)
      expect(isSafePublicUrl('http://user:pass@localhost')).toBe(false)
    })

    it('should handle URLs with fragments', () => {
      expect(isSafePublicUrl('https://example.com/page#section')).toBe(true)
    })

    it('should handle URLs with query parameters', () => {
      expect(isSafePublicUrl('https://example.com/feed?key=value')).toBe(true)
    })

    it('should be case-insensitive for hostname', () => {
      expect(isSafePublicUrl('http://LOCALHOST')).toBe(false)
      expect(isSafePublicUrl('http://LocalHost:3000')).toBe(false)
    })

    it('should handle invalid IP addresses with octets > 255', () => {
      expect(isSafePublicUrl('http://256.1.1.1')).toBe(false)
      expect(isSafePublicUrl('http://1.256.1.1')).toBe(false)
      expect(isSafePublicUrl('http://192.168.1.256')).toBe(false)
    })

    it('should allow legitimate domain starting with localhost', () => {
      // Note: localhost.example.com is NOT the same as localhost
      // It's a valid subdomain that happens to start with "localhost"
      expect(isSafePublicUrl('http://localhost.example.com')).toBe(true)
    })
  })

  describe('Cloud metadata endpoints (AWS)', () => {
    it('should block AWS metadata endpoint', () => {
      expect(isSafePublicUrl('http://169.254.169.254/latest/meta-data/')).toBe(false)
      expect(isSafePublicUrl('http://169.254.169.254/latest/user-data/')).toBe(false)
    })
  })
})
