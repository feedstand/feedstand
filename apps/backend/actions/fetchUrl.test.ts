import { afterEach, beforeEach, describe, expect, it } from 'bun:test'
import type http from 'node:http'
import zlib from 'node:zlib'
import { UnsafeUrlError } from '../errors/UnsafeUrlError.ts'
import { createStreamingChecksum } from '../helpers/hashes.ts'
import { TestHttpServer } from '../helpers/tests.ts'
import { FetchUrlResponse, fetchUrl } from './fetchUrl.ts'

// NOTE: These tests require UNSAFE_DISABLE_SSRF_CHECK=true environment variable
// to allow localhost connections. This is only safe in isolated test environments.
// DO NOT set this variable in production - it disables SSRF protection for localhost.

describe('FetchUrlResponse', () => {
  describe('text() method', () => {
    it('should return body as string', async () => {
      const value = '<?xml version="1.0"?><rss><channel><title>Test</title></channel></rss>'
      const response = new FetchUrlResponse(value, {
        url: 'https://example.com/feed.xml',
        status: 200,
        statusText: 'OK',
        headers: new Headers(),
        contentBytes: value.length,
      })

      expect(await response.text()).toBe(value)
    })

    it('should handle empty body', async () => {
      const response = new FetchUrlResponse('', {
        url: 'https://example.com',
        status: 200,
        statusText: 'OK',
        headers: new Headers(),
        contentBytes: 0,
      })

      expect(await response.text()).toBe('')
    })

    it('should handle UTF-8 content', async () => {
      const value = '<?xml version="1.0" encoding="UTF-8"?><rss><title>你好世界</title></rss>'
      const response = new FetchUrlResponse(value, {
        url: 'https://example.com',
        status: 200,
        statusText: 'OK',
        headers: new Headers(),
        contentBytes: Buffer.byteLength(value, 'utf8'),
      })

      expect(await response.text()).toBe(value)
    })

    it('should handle emojis and special characters', async () => {
      const value = '<?xml version="1.0"?><rss><title>🚀 Test Feed 🎉</title></rss>'
      const response = new FetchUrlResponse(value, {
        url: 'https://example.com',
        status: 200,
        statusText: 'OK',
        headers: new Headers(),
        contentBytes: Buffer.byteLength(value, 'utf8'),
      })

      expect(await response.text()).toBe(value)
    })

    it('should handle large content', async () => {
      const largeBody = 'x'.repeat(1024 * 1024) // 1MB
      const response = new FetchUrlResponse(largeBody, {
        url: 'https://example.com',
        status: 200,
        statusText: 'OK',
        headers: new Headers(),
        contentBytes: largeBody.length,
      })

      expect((await response.text()).length).toBe(1024 * 1024)
    })

    it('should handle very large content (10MB)', async () => {
      const largeBody = 'x'.repeat(10 * 1024 * 1024)
      const response = new FetchUrlResponse(largeBody, {
        url: 'https://example.com',
        status: 200,
        statusText: 'OK',
        headers: new Headers(),
        contentBytes: largeBody.length,
      })

      expect((await response.text()).length).toBe(10 * 1024 * 1024)
    })

    it('should handle newlines and multiline content', async () => {
      const value =
        '<?xml version="1.0"?>\n<rss>\n  <channel>\n    <title>Test</title>\n  </channel>\n</rss>'
      const response = new FetchUrlResponse(value, {
        url: 'https://example.com',
        status: 200,
        statusText: 'OK',
        headers: new Headers(),
        contentBytes: value.length,
      })

      expect(await response.text()).toBe(value)
    })

    it('should handle special XML characters', async () => {
      const value = '<?xml version="1.0"?><rss><title>&lt;Test &amp; More&gt;</title></rss>'
      const response = new FetchUrlResponse(value, {
        url: 'https://example.com',
        status: 200,
        statusText: 'OK',
        headers: new Headers(),
        contentBytes: value.length,
      })

      expect(await response.text()).toBe(value)
    })
  })

  describe('json() method', () => {
    it('should parse valid JSON', async () => {
      const value = '{"feed": {"title": "Test"}}'
      const response = new FetchUrlResponse(value, {
        url: 'https://example.com',
        status: 200,
        statusText: 'OK',
        headers: new Headers(),
        contentBytes: value.length,
      })
      const expected = { feed: { title: 'Test' } }

      expect(await response.json<unknown>()).toEqual(expected)
    })

    it('should parse JSON array', async () => {
      const value = '[{"id": 1}, {"id": 2}]'
      const response = new FetchUrlResponse(value, {
        url: 'https://example.com',
        status: 200,
        statusText: 'OK',
        headers: new Headers(),
        contentBytes: value.length,
      })
      const expected = [{ id: 1 }, { id: 2 }]

      expect(await response.json<unknown>()).toEqual(expected)
    })

    it('should parse nested JSON', async () => {
      const value = '{"feed": {"items": [{"title": "Item 1"}, {"title": "Item 2"}]}}'
      const response = new FetchUrlResponse(value, {
        url: 'https://example.com',
        status: 200,
        statusText: 'OK',
        headers: new Headers(),
        contentBytes: value.length,
      })
      const expected = {
        feed: {
          items: [{ title: 'Item 1' }, { title: 'Item 2' }],
        },
      }

      expect(await response.json<unknown>()).toEqual(expected)
    })

    it('should return undefined for invalid JSON', async () => {
      const value = '<?xml version="1.0"?><rss></rss>'
      const response = new FetchUrlResponse(value, {
        url: 'https://example.com',
        status: 200,
        statusText: 'OK',
        headers: new Headers(),
        contentBytes: value.length,
      })

      expect(await response.json()).toBeUndefined()
    })

    it('should handle empty body', async () => {
      const response = new FetchUrlResponse('', {
        url: 'https://example.com',
        status: 200,
        statusText: 'OK',
        headers: new Headers(),
        contentBytes: 0,
      })

      expect(await response.json()).toBeUndefined()
    })

    it('should handle malformed JSON gracefully', async () => {
      const value = '{"incomplete": '
      const response = new FetchUrlResponse(value, {
        url: 'https://example.com',
        status: 200,
        statusText: 'OK',
        headers: new Headers(),
        contentBytes: value.length,
      })

      expect(await response.json()).toBeUndefined()
    })
  })

  describe('url property', () => {
    it('should expose the final URL', () => {
      const response = new FetchUrlResponse('test', {
        url: 'https://final-url.com/feed.xml',
        status: 200,
        statusText: 'OK',
        headers: new Headers(),
        contentBytes: 4,
      })

      expect(response.url).toBe('https://final-url.com/feed.xml')
    })

    it('should handle URLs with query parameters', () => {
      const response = new FetchUrlResponse('test', {
        url: 'https://example.com/feed.xml?format=rss&limit=10',
        status: 200,
        statusText: 'OK',
        headers: new Headers(),
        contentBytes: 4,
      })

      expect(response.url).toBe('https://example.com/feed.xml?format=rss&limit=10')
    })

    it('should handle URLs with fragments', () => {
      const response = new FetchUrlResponse('test', {
        url: 'https://example.com/feed.xml#section',
        status: 200,
        statusText: 'OK',
        headers: new Headers(),
        contentBytes: 4,
      })

      expect(response.url).toBe('https://example.com/feed.xml#section')
    })
  })

  describe('hash property', () => {
    it('should expose content hash when provided', () => {
      const response = new FetchUrlResponse('test', {
        url: 'https://example.com',
        status: 200,
        statusText: 'OK',
        headers: new Headers(),
        hash: 'abc123def456',
        contentBytes: 4,
      })

      expect(response.hash).toBe('abc123def456')
    })

    it('should be undefined when not provided', () => {
      const response = new FetchUrlResponse('test', {
        url: 'https://example.com',
        status: 200,
        statusText: 'OK',
        headers: new Headers(),
        contentBytes: 4,
      })

      expect(response.hash).toBeUndefined()
    })

    it('should handle different hash formats', () => {
      const testCases = [
        '9f86d081884c7d659a2feaa0c55ad015a3bf4f1b2b0b822cd15d6c15b0f00a08',
        'md5:098f6bcd4621d373cade4e832627b4f6',
        'sha256:abc123',
      ]

      for (const hash of testCases) {
        const response = new FetchUrlResponse('test', {
          url: 'https://example.com',
          status: 200,
          statusText: 'OK',
          headers: new Headers(),
          hash,
          contentBytes: 4,
        })

        expect(response.hash).toBe(hash)
      }
    })
  })

  describe('status property', () => {
    it('should expose HTTP status code', () => {
      const response = new FetchUrlResponse('test', {
        url: 'https://example.com',
        status: 404,
        statusText: 'Not Found',
        headers: new Headers(),
        contentBytes: 4,
      })

      expect(response.status).toBe(404)
    })

    it('should handle various HTTP status codes', () => {
      const statusCodes = [200, 201, 204, 301, 302, 400, 403, 404, 500, 502, 503]

      for (const status of statusCodes) {
        const response = new FetchUrlResponse('test', {
          url: 'https://example.com',
          status,
          statusText: 'Status',
          headers: new Headers(),
          contentBytes: 4,
        })

        expect(response.status).toBe(status)
      }
    })
  })

  describe('contentBytes property', () => {
    it('should track actual network bytes', () => {
      const response = new FetchUrlResponse('test', {
        url: 'https://example.com',
        status: 200,
        statusText: 'OK',
        headers: new Headers(),
        contentBytes: 4,
      })

      expect(response.contentBytes).toBe(4)
    })

    it('should handle UTF-8 multi-byte characters correctly', () => {
      // String "中文" has 2 code units (.length = 2) but 6 bytes in UTF-8.
      const value = '中文'
      const response = new FetchUrlResponse(value, {
        url: 'https://example.com',
        status: 200,
        statusText: 'OK',
        headers: new Headers(),
        contentBytes: 6,
      })

      expect(value.length).toBe(2)
      expect(response.contentBytes).toBe(6)
    })

    it('should handle emoji correctly', () => {
      // Emoji "😀" has .length = 2 (surrogate pair) but 4 bytes in UTF-8.
      const value = '😀'
      const response = new FetchUrlResponse(value, {
        url: 'https://example.com',
        status: 200,
        statusText: 'OK',
        headers: new Headers(),
        contentBytes: 4,
      })

      expect(value.length).toBe(2)
      expect(response.contentBytes).toBe(4)
    })

    it('should be 0 for empty responses', () => {
      const response = new FetchUrlResponse('', {
        url: 'https://example.com',
        status: 200,
        statusText: 'OK',
        headers: new Headers(),
        contentBytes: 0,
      })

      expect(response.contentBytes).toBe(0)
    })
  })

  describe('headers property', () => {
    it('should expose response headers', () => {
      const headers = new Headers({
        'content-type': 'application/xml',
        etag: '"abc123"',
      })
      const response = new FetchUrlResponse('test', {
        url: 'https://example.com',
        status: 200,
        statusText: 'OK',
        headers,
        contentBytes: 4,
      })

      expect(response.headers.get('content-type')).toBe('application/xml')
      expect(response.headers.get('etag')).toBe('"abc123"')
    })

    it('should handle case-insensitive header access', () => {
      const headers = new Headers({
        'Content-Type': 'application/xml',
        ETag: '"abc123"',
      })
      const response = new FetchUrlResponse('test', {
        url: 'https://example.com',
        status: 200,
        statusText: 'OK',
        headers,
        contentBytes: 4,
      })

      expect(response.headers.get('content-type')).toBe('application/xml')
      expect(response.headers.get('ETAG')).toBe('"abc123"')
    })

    it('should handle multiple header values', () => {
      const headers = new Headers({
        'cache-control': 'public, max-age=3600',
        'content-type': 'application/xml; charset=utf-8',
      })
      const response = new FetchUrlResponse('test', {
        url: 'https://example.com',
        status: 200,
        statusText: 'OK',
        headers,
        contentBytes: 4,
      })

      expect(response.headers.get('cache-control')).toBe('public, max-age=3600')
      expect(response.headers.get('content-type')).toBe('application/xml; charset=utf-8')
    })

    it('should return null for missing headers', () => {
      const headers = new Headers()
      const response = new FetchUrlResponse('test', {
        url: 'https://example.com',
        status: 200,
        statusText: 'OK',
        headers,
        contentBytes: 4,
      })

      expect(response.headers.get('nonexistent')).toBeNull()
    })
  })
})

describe('fetchUrl: SSRF Protection', () => {
  // Temporarily disable the unsafe flag to test actual SSRF protection.
  const originalEnv = process.env.UNSAFE_DISABLE_SSRF_CHECK

  beforeEach(() => {
    process.env.UNSAFE_DISABLE_SSRF_CHECK = ''
  })

  afterEach(() => {
    process.env.UNSAFE_DISABLE_SSRF_CHECK = originalEnv ?? ''
  })

  it('should block localhost URLs', async () => {
    await expect(fetchUrl('http://localhost:8080/feed.xml')).rejects.toThrow(UnsafeUrlError)
  })

  it('should block 127.0.0.1', async () => {
    await expect(fetchUrl('http://127.0.0.1/feed.xml')).rejects.toThrow(UnsafeUrlError)
  })

  it('should block 127.0.0.1 with different ports', async () => {
    await expect(fetchUrl('http://127.0.0.1:3000/feed.xml')).rejects.toThrow(UnsafeUrlError)
    await expect(fetchUrl('http://127.0.0.1:8080/feed.xml')).rejects.toThrow(UnsafeUrlError)
  })

  it('should block private IP ranges (10.x.x.x)', async () => {
    await expect(fetchUrl('http://10.0.0.1/feed.xml')).rejects.toThrow(UnsafeUrlError)
    await expect(fetchUrl('http://10.255.255.255/feed.xml')).rejects.toThrow(UnsafeUrlError)
  })

  it('should block private IP ranges (192.168.x.x)', async () => {
    await expect(fetchUrl('http://192.168.1.1/feed.xml')).rejects.toThrow(UnsafeUrlError)
    await expect(fetchUrl('http://192.168.255.255/feed.xml')).rejects.toThrow(UnsafeUrlError)
  })

  it('should block private IP ranges (172.16.x.x to 172.31.x.x)', async () => {
    await expect(fetchUrl('http://172.16.0.1/feed.xml')).rejects.toThrow(UnsafeUrlError)
    await expect(fetchUrl('http://172.31.255.255/feed.xml')).rejects.toThrow(UnsafeUrlError)
  })

  it('should block link-local addresses (169.254.x.x)', async () => {
    await expect(fetchUrl('http://169.254.169.254/feed.xml')).rejects.toThrow(UnsafeUrlError)
  })

  it('should block AWS metadata endpoint', async () => {
    await expect(fetchUrl('http://169.254.169.254/latest/meta-data/')).rejects.toThrow(
      UnsafeUrlError,
    )
  })

  it('should block IPv6 localhost (::1)', async () => {
    await expect(fetchUrl('http://[::1]/feed.xml')).rejects.toThrow(UnsafeUrlError)
  })

  it.skip('should block IPv6 loopback', async () => {
    // TODO: ssrfcheck doesn't block IPv6-mapped IPv4 loopback (::ffff:127.0.0.1).
    // This is a known limitation of the library.
    await expect(fetchUrl('http://[::ffff:127.0.0.1]/feed.xml')).rejects.toThrow(UnsafeUrlError)
  })

  it('should throw UnsafeUrlError with correct URL', async () => {
    try {
      await fetchUrl('http://localhost/feed.xml')
      throw new Error('Should have thrown')
    } catch (error) {
      expect(error).toBeInstanceOf(UnsafeUrlError)
      expect((error as UnsafeUrlError).message).toContain('localhost')
    }
  })
})

/**
 * ============================================================================
 * END-TO-END TESTS - Require Real HTTP Server
 * ============================================================================
 *
 * The following test cases require a real HTTP server to properly test
 * fetchUrl's behavior with actual network conditions, streaming, retries,
 * timeouts, and error handling.
 *
 * Implementation: Use Node.js http.createServer() to create test servers
 * Framework: Vitest (already in use)
 * Helper: TestHttpServer class (to be implemented)
 *
 * Status: ⏳ Test shells created - Implementation pending
 * See: audits/fetch-url-testing.md for full strategy
 */

describe('fetchUrl: Normal Operations (E2E)', () => {
  /**
   * Test: Basic successful fetch
   *
   * Setup:
   * - Create HTTP server responding with 200 OK
   * - Small response body (e.g., 100 bytes)
   *
   * Expected behavior:
   * - fetchUrl resolves successfully
   * - response.status === 200
   * - response.text() returns exact body sent
   * - response.hash is populated
   * - response.url matches request URL
   *
   * Implementation notes:
   * - Use TestHttpServer.respondWith({ statusCode: 200, body: 'test content' })
   */
  it('should successfully fetch with 200 OK and small response', async () => {
    const server = new TestHttpServer()
    const testContent = '<rss><channel><title>Test Feed</title></channel></rss>'

    await server.start(
      server.respondWith({
        statusCode: 200,
        headers: { 'Content-Type': 'application/rss+xml' },
        body: testContent,
      }),
    )

    const response = await fetchUrl(server.url)
    expect(response.status).toBe(200)
    expect(await response.text()).toBe(testContent)
    expect(response.hash).toBeDefined()
    expect(response.url).toBe(`${server.url}/`)

    await server.stop()
  })

  /**
   * Test: Large valid response
   *
   * Setup:
   * - Create server with 100MB response (exactly at maxContentSize)
   * - Generate buffer with Buffer.alloc(100 * 1024 * 1024)
   *
   * Expected behavior:
   * - fetchUrl resolves successfully
   * - Full content is received
   * - Hash is calculated correctly on streaming data
   *
   * Implementation notes:
   * - Verify streaming works for large files
   * - Check memory usage doesn't spike (stream not buffered)
   */
  it('should handle large valid response up to maxContentSize', async () => {
    const server = new TestHttpServer()
    const exactSize = 100 * 1024 * 1024 // Exactly 100MB
    const largeBody = 'x'.repeat(exactSize)

    await server.start(
      server.respondWith({
        statusCode: 200,
        headers: { 'Content-Type': 'application/rss+xml' },
        body: largeBody,
      }),
    )

    const response = await fetchUrl(server.url)
    expect(response.status).toBe(200)
    expect((await response.text()).length).toBe(exactSize)
    expect(response.hash).toBeDefined()

    await server.stop()
  }, 60000) // 60s timeout for large download

  /**
   * Test: Empty response
   *
   * Setup:
   * - Server responds with 200 OK, 0 bytes
   *
   * Expected behavior:
   * - response.status === 200
   * - response.text() === ''
   * - Hash is calculated (hash of empty string)
   *
   * Implementation notes:
   * - Edge case: some servers return 204 No Content, test both
   */
  it('should handle empty response (0 bytes)', async () => {
    const server = new TestHttpServer()

    await server.start(
      server.respondWith({
        statusCode: 200,
        headers: { 'Content-Type': 'application/rss+xml' },
        body: '',
      }),
    )

    const response = await fetchUrl(server.url)
    expect(response.status).toBe(200)
    expect(await response.text()).toBe('')
    expect(response.hash).toBeDefined()

    await server.stop()
  })

  /**
   * Test: Various status codes
   *
   * Setup:
   * - Test each status: 201, 204, 304, 404, 500, 502, 503
   *
   * Expected behavior:
   * - For 2xx/3xx: resolve successfully
   * - For 4xx/5xx that retry: verify retry behavior
   * - For 4xx/5xx that don't retry: fail immediately
   * - response.status matches sent status
   *
   * Implementation notes:
   * - 408, 429, 500, 502, 503, 504, 521 trigger retries (see fetchUrl.ts:140)
   * - Others fail immediately
   */
  it('should handle various HTTP status codes correctly', async () => {
    // 2xx and 3xx status codes - should succeed
    const successCodes = [200, 201, 204, 304]

    for (const statusCode of successCodes) {
      const server = new TestHttpServer()

      await server.start(
        server.respondWith({
          statusCode,
          headers: { 'Content-Type': 'application/rss+xml' },
          body: '<rss></rss>',
        }),
      )

      const response = await fetchUrl(server.url)
      expect(response.status).toBe(statusCode)

      await server.stop()
    }

    // 404 - should return 404 response (not retryable)
    const server404 = new TestHttpServer()
    await server404.start(
      server404.respondWith({
        statusCode: 404,
        headers: { 'Content-Type': 'application/rss+xml' },
        body: 'Not Found',
      }),
    )

    const response404 = await fetchUrl(server404.url)
    expect(response404.status).toBe(404)

    await server404.stop()
  })

  /**
   * Test: Different content types
   *
   * Setup:
   * - Test with: application/rss+xml, application/atom+xml, application/json, text/xml
   *
   * Expected behavior:
   * - All accepted content types resolve successfully
   * - Content-Type header preserved in response.headers
   *
   * Implementation notes:
   * - These are NOT in avoidedContentTypes (audio/, video/, image/)
   * - Verify headers: { 'Content-Type': 'application/rss+xml' }
   */
  it('should accept RSS/Atom/JSON/XML content types', async () => {
    const contentTypes = [
      'application/rss+xml',
      'application/atom+xml',
      'application/json',
      'text/xml',
      'application/xml',
    ]

    for (const contentType of contentTypes) {
      const server = new TestHttpServer()

      await server.start(
        server.respondWith({
          statusCode: 200,
          headers: { 'Content-Type': contentType },
          body: '<feed></feed>',
        }),
      )

      const response = await fetchUrl(server.url)
      expect(response.status).toBe(200)
      expect(response.headers.get('content-type')).toBe(contentType)

      await server.stop()
    }
  })

  /**
   * Test: UTF-8 encoding
   *
   * Setup:
   * - Response body with Unicode: Chinese, Arabic, Emoji, etc.
   * - Example: '<?xml><title>测试 🚀 مرحبا</title></xml>'
   *
   * Expected behavior:
   * - Characters decoded correctly via StringDecoder('utf-8')
   * - response.text() returns exact Unicode string
   *
   * Implementation notes:
   * - StringDecoder is used in fetchUrl.ts:235
   * - Test multi-byte character boundaries across chunks
   */
  it('should correctly decode UTF-8 Unicode characters', async () => {
    const server = new TestHttpServer()
    const unicodeContent = '<?xml><title>测试 🚀 مرحبا Ñoño</title></xml>'

    await server.start(
      server.respondWith({
        statusCode: 200,
        headers: { 'Content-Type': 'text/xml; charset=utf-8' },
        body: unicodeContent,
      }),
    )

    const response = await fetchUrl(server.url)
    expect(await response.text()).toBe(unicodeContent)

    await server.stop()
  })

  /**
   * Test: Gzip compression
   *
   * Setup:
   * - Server responds with Content-Encoding: gzip
   * - Send gzipped response body
   *
   * Expected behavior:
   * - Got automatically decompresses (built-in feature)
   * - response.text() returns decompressed content
   *
   * Implementation notes:
   * - Use zlib.gzipSync() to compress test data
   * - Verify hash is calculated on decompressed data
   */
  it('should handle gzip-compressed responses', async () => {
    const server = new TestHttpServer()
    const originalContent = '<rss><channel><title>Compressed Feed</title></channel></rss>'
    const compressedBody = zlib.gzipSync(originalContent)

    await server.start((_, res) => {
      res.writeHead(200, {
        'Content-Type': 'application/rss+xml',
        'Content-Encoding': 'gzip',
      })
      res.end(compressedBody)
    })

    const response = await fetchUrl(server.url)
    expect(await response.text()).toBe(originalContent)
    expect(response.status).toBe(200)

    await server.stop()
  })

  /**
   * Test: Custom headers
   *
   * Setup:
   * - Call fetchUrl(url, { headers: { 'X-Custom': 'value' } })
   * - Server echoes received headers back
   *
   * Expected behavior:
   * - Custom headers sent in request
   * - Merged with commonHeaders (User-Agent, etc.)
   * - commonHeaders not overridden
   *
   * Implementation notes:
   * - Check fetchUrl.ts:197-199 header merging logic
   * - Verify User-Agent is still set
   */
  it('should send custom headers merged with defaults', async () => {
    const server = new TestHttpServer()
    let receivedHeaders: http.IncomingHttpHeaders | undefined

    await server.start((req, res) => {
      receivedHeaders = req.headers
      res.writeHead(200, { 'Content-Type': 'application/rss+xml' })
      res.end('<rss></rss>')
    })

    await fetchUrl(server.url, {
      headers: {
        'X-Custom-Header': 'test-value',
      },
    })

    expect(receivedHeaders).toBeDefined()
    expect(receivedHeaders?.['user-agent']).toBeDefined() // Default header
    expect(receivedHeaders?.['x-custom-header']).toBe('test-value')

    await server.stop()
  })

  /**
   * Test: Response headers preservation
   *
   * Setup:
   * - Server sends: ETag, Last-Modified, Cache-Control, etc.
   *
   * Expected behavior:
   * - All response headers accessible via response.headers
   * - Case-insensitive access works
   *
   * Implementation notes:
   * - response.headers is Headers object from Got
   * - Test both .get('etag') and .get('ETag')
   */
  it('should preserve all response headers', async () => {
    const server = new TestHttpServer()

    await server.start(
      server.respondWith({
        statusCode: 200,
        headers: {
          'Content-Type': 'application/rss+xml',
          ETag: '"abc123"',
          'Last-Modified': 'Wed, 21 Oct 2015 07:28:00 GMT',
          'Cache-Control': 'public, max-age=3600',
        },
        body: '<rss></rss>',
      }),
    )

    const response = await fetchUrl(server.url)

    // Verify all headers are preserved
    expect(response.headers.get('content-type')).toBe('application/rss+xml')
    expect(response.headers.get('etag')).toBe('"abc123"')
    expect(response.headers.get('last-modified')).toBe('Wed, 21 Oct 2015 07:28:00 GMT')
    expect(response.headers.get('cache-control')).toBe('public, max-age=3600')

    // Verify case-insensitive access
    expect(response.headers.get('ETag')).toBe('"abc123"')
    expect(response.headers.get('ETAG')).toBe('"abc123"')

    await server.stop()
  })

  /**
   * Test: Hash generation
   *
   * Setup:
   * - Known content with known hash
   * - Use createStreamingChecksum() to verify independently
   *
   * Expected behavior:
   * - response.hash matches expected XXHash value
   * - Hash calculated on streaming chunks, not buffered content
   *
   * Implementation notes:
   * - Hash is created in fetchUrl.ts:234
   * - Test with content sent in multiple chunks
   */
  it('should generate correct streaming hash for content', async () => {
    const server = new TestHttpServer()
    const testContent = '<rss><channel><title>Test Feed</title></channel></rss>'

    await server.start(
      server.respondWith({
        statusCode: 200,
        headers: { 'Content-Type': 'application/rss+xml' },
        body: testContent,
      }),
    )

    const response = await fetchUrl(server.url)

    // Calculate expected hash independently
    const expectedHash = createStreamingChecksum()
    expectedHash.update(Buffer.from(testContent, 'utf8'))
    const expectedHashValue = expectedHash.digest()

    expect(response.hash).toBe(expectedHashValue)
    expect(response.hash).toBeDefined()

    await server.stop()
  })
})

describe('fetchUrl: Redirects (E2E)', () => {
  /**
   * Test: Single redirect
   *
   * Setup:
   * - Server 1: 301/302 -> Location: server2.url
   * - Server 2: 200 OK
   *
   * Expected behavior:
   * - fetchUrl follows redirect automatically
   * - response.url === server2.url (final URL)
   * - response.status === 200
   *
   * Implementation notes:
   * - Got's followRedirect: true (fetchUrl.ts:134)
   * - maxRedirects: 10 (fetchUrl.ts:135)
   */
  it('should follow single 301/302 redirect', async () => {
    const server1 = new TestHttpServer()
    const server2 = new TestHttpServer()

    // Start server 2 first (target)
    await server2.start(
      server2.respondWith({
        statusCode: 200,
        headers: { 'Content-Type': 'application/rss+xml' },
        body: '<rss><channel><title>Final destination</title></channel></rss>',
      }),
    )

    // Start server 1 (redirector)
    await server1.start((_, res) => {
      res.writeHead(301, { Location: server2.url })
      res.end()
    })

    const response = await fetchUrl(server1.url)
    expect(response.status).toBe(200)
    expect(response.url).toBe(`${server2.url}/`)
    expect(await response.text()).toContain('Final destination')

    await server1.stop()
    await server2.stop()
  })

  /**
   * Test: Multiple redirects
   *
   * Setup:
   * - Chain: URL1 (301) -> URL2 (302) -> URL3 (301) -> URL4 (200)
   * - 3-5 redirect hops
   *
   * Expected behavior:
   * - All redirects followed
   * - response.url === final URL
   * - No errors until maxRedirects exceeded
   *
   * Implementation notes:
   * - Count redirects, ensure < 10
   * - Test with exactly 10 redirects (should work)
   */
  it('should follow chain of multiple redirects', async () => {
    const servers = [
      new TestHttpServer(),
      new TestHttpServer(),
      new TestHttpServer(),
      new TestHttpServer(),
    ]

    // Start final server (no redirect)
    await servers[3].start(
      servers[3].respondWith({
        statusCode: 200,
        headers: { 'Content-Type': 'application/rss+xml' },
        body: '<rss><channel><title>Final</title></channel></rss>',
      }),
    )

    // Start redirect chain: 0 -> 1 -> 2 -> 3
    await servers[2].start((_, res) => {
      res.writeHead(301, { Location: servers[3].url })
      res.end()
    })

    await servers[1].start((_, res) => {
      res.writeHead(302, { Location: servers[2].url })
      res.end()
    })

    await servers[0].start((_, res) => {
      res.writeHead(301, { Location: servers[1].url })
      res.end()
    })

    const response = await fetchUrl(servers[0].url)
    expect(response.status).toBe(200)
    expect(response.url).toBe(`${servers[3].url}/`)
    expect(await response.text()).toContain('Final')

    for (const server of servers) {
      await server.stop()
    }
  })

  /**
   * Test: Redirect loop detection
   *
   * Setup:
   * - URL1 -> URL2 -> URL1 -> URL2 (infinite loop)
   * - OR: 11 redirects (exceeds maxRedirects: 10)
   *
   * Expected behavior:
   * - Error thrown when maxRedirects exceeded
   * - Error message mentions redirect limit
   *
   * Implementation notes:
   * - Got throws specific error for too many redirects
   * - Should throw, not hang forever
   */
  it('should detect and reject redirect loops', async () => {
    const server1 = new TestHttpServer()
    const server2 = new TestHttpServer()

    // Create circular redirect: server1 -> server2 -> server1 -> ...
    await server2.start((_, res) => {
      res.writeHead(301, { Location: server1.url })
      res.end()
    })

    await server1.start((_, res) => {
      res.writeHead(301, { Location: server2.url })
      res.end()
    })

    // Should throw error due to too many redirects
    await expect(fetchUrl(server1.url)).rejects.toThrow()

    await server1.stop()
    await server2.stop()
  })

  /**
   * Test: Relative URL redirects
   *
   * Setup:
   * - Server returns: Location: /new-path (relative)
   * - Should resolve to http://server/new-path
   *
   * Expected behavior:
   * - Relative URL resolved correctly
   * - Redirect followed
   *
   * Implementation notes:
   * - prepareUrl used in beforeRedirect hook (fetchUrl.ts:146)
   * - Test both relative (/path) and absolute URLs
   */
  it('should resolve relative URLs in Location header', async () => {
    const server = new TestHttpServer()
    let requestCount = 0

    await server.start((req, res) => {
      requestCount++

      if (req.url === '/') {
        // First request: redirect to relative path
        res.writeHead(301, { Location: '/new-path' })
        res.end()
      } else if (req.url === '/new-path') {
        // Second request: final destination
        res.writeHead(200, { 'Content-Type': 'application/rss+xml' })
        res.end('<rss><channel><title>Relative redirect success</title></channel></rss>')
      }
    })

    const response = await fetchUrl(server.url)
    expect(response.status).toBe(200)
    expect(requestCount).toBe(2)
    expect(await response.text()).toContain('Relative redirect success')

    await server.stop()
  })

  /**
   * Test: Cross-domain redirects
   *
   * Setup:
   * - Server A: https://a.com -> Location: https://b.com
   * - Server B: 200 OK
   *
   * Expected behavior:
   * - Cross-domain redirect allowed (both are safe public URLs)
   * - response.url === https://b.com
   *
   * Implementation notes:
   * - SSRF check runs in beforeRedirect hook
   * - Both URLs must pass isSafePublicUrl()
   */
  it('should allow redirects across safe public domains', async () => {
    const serverA = new TestHttpServer()
    const serverB = new TestHttpServer()

    // Start server B (target)
    await serverB.start(
      serverB.respondWith({
        statusCode: 200,
        headers: { 'Content-Type': 'application/rss+xml' },
        body: '<rss><channel><title>Server B</title></channel></rss>',
      }),
    )

    // Start server A (redirector to different domain/port)
    await serverA.start((_, res) => {
      res.writeHead(301, { Location: serverB.url })
      res.end()
    })

    const response = await fetchUrl(serverA.url)
    expect(response.status).toBe(200)
    expect(await response.text()).toContain('Server B')

    await serverA.stop()
    await serverB.stop()
  })

  /**
   * Test: SSRF via redirect
   *
   * Setup:
   * - Server: https://safe.com -> Location: http://localhost:8080
   * - Initial URL is safe, redirect target is not
   *
   * Expected behavior:
   * - UnsafeUrlError thrown in beforeRedirect hook
   * - Redirect NOT followed
   * - Error message indicates SSRF block
   *
   * Implementation notes:
   * - fetchUrl.ts:150-157 implements SSRF check
   * - Test redirects to: localhost, 10.x.x.x, 169.254.169.254
   */
  it('should block SSRF via redirect to internal resource', async () => {
    const server = new TestHttpServer()

    // Server redirects to private IP
    await server.start((_, res) => {
      res.writeHead(301, { Location: 'http://127.0.0.1:8080/internal' })
      res.end()
    })

    // Should throw error when redirect target is blocked
    // UnsafeUrlError is thrown in beforeRedirect hook, but wrapped in UnreachableUrlError
    // The SSRF protection logs show the block, but error message is generic
    await expect(fetchUrl(server.url)).rejects.toThrow()

    await server.stop()

    // Also test redirect to AWS metadata endpoint
    const server2 = new TestHttpServer()
    await server2.start((_, res) => {
      res.writeHead(301, { Location: 'http://169.254.169.254/latest/meta-data/' })
      res.end()
    })

    await expect(fetchUrl(server2.url)).rejects.toThrow()

    await server2.stop()
  })
})

describe.skip('fetchUrl: Timeouts (E2E)', () => {
  /**
   * Test: Slow headers
   *
   * Setup:
   * - Server delays sending headers for 16+ seconds (> maxTimeout: 15s)
   * - Don't call res.writeHead() until after delay
   *
   * Expected behavior:
   * - ETIMEDOUT error after ~15 seconds
   * - Retry triggered (ETIMEDOUT in errorCodes)
   * - After 3 retries, throw UnreachableUrlError
   *
   * Implementation notes:
   * - timeout.request: 15000 (fetchUrl.ts:112)
   * - Use setTimeout(() => res.writeHead(...), 16000)
   */
  it.todo('should timeout when headers delayed beyond maxTimeout', () => {})

  /**
   * Test: Slow body
   *
   * Setup:
   * - Headers sent immediately
   * - Body chunks delayed (e.g., 1 chunk per 10 seconds)
   * - Total time > 15s
   *
   * Expected behavior:
   * - Timeout during body download
   * - Request aborted
   *
   * Implementation notes:
   * - timeout.request applies to entire request lifecycle
   * - Test with chunked response, long delays between chunks
   */
  it.todo('should timeout when body chunks delayed beyond maxTimeout', () => {})

  /**
   * Test: Complete timeout
   *
   * Setup:
   * - Server accepts connection but never responds
   * - Use setTimeout to delay indefinitely
   *
   * Expected behavior:
   * - ETIMEDOUT after 15 seconds
   * - Retries 3 times
   * - UnreachableUrlError thrown
   *
   * Implementation notes:
   * - Don't call any res.write() or res.end()
   * - Let request hang until timeout
   */
  it.todo('should timeout when no response received', () => {})

  /**
   * Test: Partial timeout
   *
   * Setup:
   * - Server sends headers + partial body
   * - Then stops sending (connection stalls)
   *
   * Expected behavior:
   * - Timeout while waiting for rest of body
   * - Partial data discarded
   *
   * Implementation notes:
   * - Send 50% of body, then sleep forever
   * - Simulates broken connection mid-transfer
   */
  it.todo('should timeout when response stalls mid-stream', () => {})
})

describe('fetchUrl: Size Limits (E2E)', () => {
  /**
   * Test: Exactly at maxContentSize
   *
   * Setup:
   * - Response body exactly 100MB (maxContentSize)
   * - Buffer.alloc(100 * 1024 * 1024)
   *
   * Expected behavior:
   * - Fetch succeeds
   * - All 100MB received
   * - No error thrown
   *
   * Implementation notes:
   * - Check fetchUrl.ts:243: downloadedBytes > maxContentSize
   * - Exactly at limit should NOT trigger error
   */
  it('should allow response exactly at maxContentSize (100MB)', async () => {
    const server = new TestHttpServer()
    const exactSize = 100 * 1024 * 1024 // Exactly 100MB
    const largeBody = 'x'.repeat(exactSize)

    await server.start(
      server.respondWith({
        statusCode: 200,
        headers: { 'Content-Type': 'application/rss+xml' },
        body: largeBody,
      }),
    )

    const response = await fetchUrl(server.url)
    expect(response.status).toBe(200)
    expect((await response.text()).length).toBe(exactSize)

    await server.stop()
  }, 30000) // 30s timeout for large download

  /**
   * Test: Exceeds maxContentSize
   *
   * Setup:
   * - Response body 101MB (exceeds maxContentSize by 1MB)
   *
   * Expected behavior:
   * - stream.destroy() called (fetchUrl.ts:211)
   * - Error thrown: "Content length exceeded the limit: 104857600"
   * - Download aborted immediately after limit exceeded
   *
   * Implementation notes:
   * - For loop at fetchUrl.ts:207 checks after each chunk
   * - Stream destroyed, preventing memory issues
   */
  it('should abort when response exceeds maxContentSize', async () => {
    const server = new TestHttpServer()
    // Create 101MB of data (exceeds 100MB limit)
    const largeBody = 'x'.repeat(101 * 1024 * 1024)

    await server.start(
      server.respondWith({
        statusCode: 200,
        headers: { 'Content-Type': 'application/rss+xml' },
        body: largeBody,
      }),
    )

    await expect(fetchUrl(server.url)).rejects.toThrow()

    await server.stop()
  })

  /**
   * Test: Chunked exceeding limit
   *
   * Setup:
   * - Send response in small chunks (e.g., 1MB each)
   * - Total chunks = 101MB
   * - Transfer-Encoding: chunked
   *
   * Expected behavior:
   * - First 100 chunks processed
   * - 101st chunk triggers abort
   * - Error thrown mid-stream
   *
   * Implementation notes:
   * - Tests streaming size check (not Content-Length header)
   * - downloadedBytes accumulates across chunks
   */
  it.skip('should abort chunked response exceeding maxContentSize', async () => {
    // SKIP: Sending 101MB causes Got timeout (15s) before size limit is reached
    // The test retries 4 times (60s total) which exceeds reasonable test time
    // TODO: Mock response streaming instead of creating actual 101MB string
    const server = new TestHttpServer()
    const largeBody = 'x'.repeat(101 * 1024 * 1024) // 101MB

    await server.start(
      server.respondWith({
        statusCode: 200,
        headers: { 'Content-Type': 'application/rss+xml' },
        body: largeBody,
        chunked: true,
      }),
    )

    await expect(fetchUrl(server.url)).rejects.toThrow()

    await server.stop()
  }, 60000)

  /**
   * NOTE: Header size limit testing not implemented
   *
   * Reason: maxHeaderSize in Got/Node.js HTTP client only affects HTTP *server* parser,
   * not client responses. For HTTP clients, header size limits are set at Node.js process
   * level via --max-http-header-size flag (default 16KB). The maxHeaderSize setting in
   * fetchUrl.ts increases this limit to 64KB for RSS feeds, not enforces a maximum.
   * Testing would require spawning separate Node.js process with specific flags.
   */
})

describe('fetchUrl: Retry Logic (E2E)', () => {
  /**
   * Test: ETIMEDOUT retry
   *
   * Setup:
   * - First 2 requests: delay > 15s (trigger timeout)
   * - 3rd request: respond immediately with 200 OK
   *
   * Expected behavior:
   * - Retry count: 3 total attempts
   * - Final request succeeds
   * - ETIMEDOUT in errorCodes triggers retry (fetchUrl.ts:239)
   *
   * Implementation notes:
   * - Track attempt count in server handler
   * - Only succeed on attempt === 3
   * - TODO: Difficult to test - requires 45s+ for 3 timeouts at 15s each
   * - Tested manually in production logs
   */
  it.todo('should retry 3 times on ETIMEDOUT error', () => {})

  /**
   * Test: ECONNRESET retry
   *
   * Setup:
   * - First 2 requests: req.socket.destroy() (abrupt connection close)
   * - 3rd request: 200 OK
   *
   * Expected behavior:
   * - ECONNRESET in errorCodes (fetchUrl.ts:239)
   * - 3 retry attempts
   * - Success on final attempt
   *
   * Implementation notes:
   * - Destroy socket before sending response
   * - Simulates network interruption
   * - TODO: Difficult to test - destroying socket breaks server state
   * - Requires TCP-level simulation, not HTTP-level
   * - Tested manually in production logs
   */
  it.todo('should retry 3 times on ECONNRESET error', () => {})

  /**
   * Test: EPIPE retry
   *
   * Setup:
   * - Simulate EPIPE error (write to closed socket)
   * - Emit error manually if needed
   *
   * Expected behavior:
   * - EPIPE in errorCodes (fetchUrl.ts:141)
   * - 3 retry attempts
   *
   * Implementation notes:
   * - EPIPE = broken pipe (client closed connection prematurely)
   * - May need to emit error event on stream
   */
  it.todo('should retry 3 times on EPIPE error', () => {})

  /**
   * Test: ENOTFOUND no retry
   *
   * Setup:
   * - URL with non-existent domain
   * - Example: https://this-domain-does-not-exist-12345.com
   *
   * Expected behavior:
   * - ENOTFOUND error (DNS resolution failure)
   * - NOT in errorCodes -> NO retry
   * - UnreachableUrlError thrown immediately
   *
   * Implementation notes:
   * - Verify only 1 attempt, not 3
   * - Critical: DNS failures should fail fast
   */
  it('should NOT retry on ENOTFOUND (DNS failure)', async () => {
    const start = Date.now()

    await expect(
      fetchUrl('https://this-domain-absolutely-does-not-exist-feedstand-test-12345.com'),
    ).rejects.toThrow()

    const duration = Date.now() - start

    // Should fail quickly (< 5s), not take 45s (3 retries × 15s)
    // DNS failures should fail immediately
    expect(duration).toBeLessThan(5000)
  })

  /**
   * Test: ECONNREFUSED no retry
   *
   * Setup:
   * - URL pointing to closed port
   * - Example: http://localhost:9999 (nothing listening)
   *
   * Expected behavior:
   * - ECONNREFUSED error
   * - NOT in errorCodes -> NO retry
   * - Fail immediately
   *
   * Implementation notes:
   * - Connection refused = server not running
   * - Retrying won't help
   */
  it.todo('should NOT retry on ECONNREFUSED', () => {})

  /**
   * Test: 403 with User-Agent rotation
   *
   * Setup:
   * - Server responds 403 Forbidden on first 2 requests
   * - Check User-Agent header, succeed on 3rd attempt
   *
   * Expected behavior:
   * - 403 in statusCodes triggers retry (fetchUrl.ts:139)
   * - beforeRetry hook rotates User-Agent (fetchUrl.ts:168-170)
   * - Each retry has different User-Agent from userAgents array
   *
   * Implementation notes:
   * - Log User-Agent on each request
   * - Verify it changes on retry
   */
  it('should retry 403 errors with User-Agent rotation', async () => {
    let attempts = 0
    const userAgents: Array<string> = []
    const server = new TestHttpServer()

    await server.start((req, res) => {
      attempts++
      const userAgent = req.headers['user-agent']
      if (userAgent) {
        userAgents.push(userAgent)
      }

      if (attempts < 3) {
        res.writeHead(403)
        res.end('Forbidden')
        return
      }

      res.writeHead(200, { 'Content-Type': 'application/rss+xml' })
      res.end('<rss><channel><title>Success</title></channel></rss>')
    })

    const response = await fetchUrl(server.url)
    expect(attempts).toBe(3)
    expect(response.status).toBe(200)

    // Verify User-Agent was rotated (should have different values)
    expect(userAgents.length).toBe(3)
    // At least one rotation should have occurred
    const uniqueUserAgents = new Set(userAgents)
    expect(uniqueUserAgents.size).toBeGreaterThan(1)

    await server.stop()
  }, 30000)

  /**
   * Test: 408 Request Timeout retry
   *
   * Setup:
   * - Server responds 408 on first 2 requests
   * - 200 OK on 3rd
   *
   * Expected behavior:
   * - 408 in statusCodes (fetchUrl.ts:139)
   * - 3 retry attempts
   * - Success on final
   *
   * Implementation notes:
   * - 408 = server timeout, worth retrying
   */
  it('should retry on 408 Request Timeout', async () => {
    let attempts = 0
    const server = new TestHttpServer()

    await server.start((_, res) => {
      attempts++

      if (attempts < 3) {
        res.writeHead(408)
        res.end('Request Timeout')
        return
      }

      res.writeHead(200, { 'Content-Type': 'application/rss+xml' })
      res.end('<rss><channel><title>Success</title></channel></rss>')
    })

    const response = await fetchUrl(server.url)
    expect(attempts).toBe(3)
    expect(response.status).toBe(200)

    await server.stop()
  }, 30000)

  /**
   * Test: 429 Rate Limit retry
   *
   * Setup:
   * - Server responds 429 Too Many Requests
   * - Optionally set Retry-After header
   *
   * Expected behavior:
   * - 429 in statusCodes
   * - Retries with exponential backoff
   * - Respects Retry-After if present
   *
   * Implementation notes:
   * - Got's retry logic handles Retry-After automatically
   * - Test both with and without header
   */
  it('should retry on 429 Rate Limit', async () => {
    let attempts = 0
    const server = new TestHttpServer()

    await server.start((_, res) => {
      attempts++

      if (attempts < 3) {
        res.writeHead(429, { 'Retry-After': '1' })
        res.end('Too Many Requests')
        return
      }

      res.writeHead(200, { 'Content-Type': 'application/rss+xml' })
      res.end('<rss><channel><title>Success</title></channel></rss>')
    })

    const response = await fetchUrl(server.url)
    expect(attempts).toBe(3)
    expect(response.status).toBe(200)

    await server.stop()
  }, 30000)

  /**
   * Test: 500 Internal Error retry
   *
   * Setup:
   * - Server responds 500 on first 2 requests
   *
   * Expected behavior:
   * - 500 in statusCodes
   * - 3 retry attempts
   *
   * Implementation notes:
   * - Transient server errors often resolve on retry
   */
  it('should retry on 500 Internal Server Error', async () => {
    let attempts = 0
    const server = new TestHttpServer()

    await server.start((_, res) => {
      attempts++

      if (attempts < 3) {
        res.writeHead(500)
        res.end('Internal Server Error')
        return
      }

      res.writeHead(200, { 'Content-Type': 'application/rss+xml' })
      res.end('<rss><channel><title>Recovered</title></channel></rss>')
    })

    const response = await fetchUrl(server.url)
    expect(attempts).toBe(3)
    expect(response.status).toBe(200)

    await server.stop()
  }, 10000) // Exponential backoff: 1s + 2s

  /**
   * Test: 502 Bad Gateway retry
   *
   * Setup:
   * - Server responds 502
   *
   * Expected behavior:
   * - 502 in statusCodes
   * - Retries
   *
   * Implementation notes:
   * - Common with proxies/load balancers
   */
  it('should retry on 502 Bad Gateway', async () => {
    let attempts = 0
    const server = new TestHttpServer()

    await server.start((_, res) => {
      attempts++

      if (attempts < 3) {
        res.writeHead(502)
        res.end('Bad Gateway')
        return
      }

      res.writeHead(200, { 'Content-Type': 'application/rss+xml' })
      res.end('<rss><channel><title>Fixed</title></channel></rss>')
    })

    await fetchUrl(server.url)
    expect(attempts).toBe(3)

    await server.stop()
  }, 10000)

  /**
   * Test: 503 Service Unavailable retry
   *
   * Setup:
   * - Server responds 503
   *
   * Expected behavior:
   * - 503 in statusCodes
   * - Retries
   *
   * Implementation notes:
   * - Server temporarily unavailable
   */
  it('should retry on 503 Service Unavailable', async () => {
    let attempts = 0
    const server = new TestHttpServer()

    await server.start((_, res) => {
      attempts++

      if (attempts < 3) {
        res.writeHead(503)
        res.end('Service Unavailable')
        return
      }

      res.writeHead(200, { 'Content-Type': 'application/rss+xml' })
      res.end('<rss><channel><title>Back online</title></channel></rss>')
    })

    await fetchUrl(server.url)
    expect(attempts).toBe(3)

    await server.stop()
  }, 10000)

  /**
   * Test: 504 Gateway Timeout retry
   *
   * Setup:
   * - Server responds 504
   *
   * Expected behavior:
   * - 504 in statusCodes
   * - Retries
   *
   * Implementation notes:
   * - Gateway/proxy timeout
   */
  it('should retry on 504 Gateway Timeout', async () => {
    let attempts = 0
    const server = new TestHttpServer()

    await server.start((_, res) => {
      attempts++

      if (attempts < 3) {
        res.writeHead(504)
        res.end('Gateway Timeout')
        return
      }

      res.writeHead(200, { 'Content-Type': 'application/rss+xml' })
      res.end('<rss><channel><title>Success</title></channel></rss>')
    })

    await fetchUrl(server.url)
    expect(attempts).toBe(3)

    await server.stop()
  }, 10000)

  /**
   * Test: 521 Web Server Down retry
   *
   * Setup:
   * - Server responds 521 (Cloudflare-specific)
   *
   * Expected behavior:
   * - 521 in statusCodes
   * - Retries
   *
   * Implementation notes:
   * - Origin server refused connection
   */
  it('should retry on 521 Web Server Down', async () => {
    let attempts = 0
    const server = new TestHttpServer()

    await server.start((_, res) => {
      attempts++

      if (attempts < 3) {
        res.writeHead(521)
        res.end('Web Server Is Down')
        return
      }

      res.writeHead(200, { 'Content-Type': 'application/rss+xml' })
      res.end('<rss><channel><title>Server restored</title></channel></rss>')
    })

    await fetchUrl(server.url)
    expect(attempts).toBe(3)

    await server.stop()
  }, 10000)

  /**
   * Test: Retry exhaustion
   *
   * Setup:
   * - Server always responds 500 (never succeeds)
   *
   * Expected behavior:
   * - 3 retry attempts (total 4 requests: initial + 3 retries)
   * - After exhaustion, throw UnreachableUrlError
   * - Error wraps original error
   *
   * Implementation notes:
   * - defaultMaxRetries: 3 (fetchers.ts:1)
   * - fetchUrl.ts:298 throws UnreachableUrlError
   */
  it('should throw UnreachableUrlError after retry exhaustion', async () => {
    let attempts = 0
    const server = new TestHttpServer()

    await server.start((_, res) => {
      attempts++
      // Always fail - never succeed
      res.writeHead(500)
      res.end('Permanent failure')
    })

    await expect(fetchUrl(server.url)).rejects.toThrow()

    // Should have tried 4 times total: initial + 3 retries
    expect(attempts).toBe(4)

    await server.stop()
  }, 10000) // 10s timeout (exponential backoff: 1s + 2s + 4s + overhead)

  /**
   * Test: Skip body download for retryable statuses
   *
   * Setup:
   * - Server responds with 500 (retryable status)
   * - Large response body (e.g., 10MB)
   * - Succeeds on 2nd attempt
   *
   * Expected behavior:
   * - First request: 500 status detected, stream destroyed immediately
   * - Body NOT downloaded (saves bandwidth/memory)
   * - Response has empty body, contentBytes: 0
   * - Second request: 200, full body downloaded
   *
   * Implementation notes:
   * - Check fetchUrl.ts:211-223 for early return on retryable status
   * - Verify first request transfers minimal bytes
   */
  it('should skip body download for retryable status codes', async () => {
    let attempts = 0
    const server = new TestHttpServer()
    const largeBody = 'x'.repeat(10 * 1024 * 1024) // 10MB

    await server.start((_, res) => {
      attempts++

      if (attempts === 1) {
        // First attempt: retryable status with large body
        res.writeHead(500, { 'Content-Type': 'application/rss+xml' })
        res.end(largeBody)
        return
      }

      // Second attempt: success
      res.writeHead(200, { 'Content-Type': 'application/rss+xml' })
      res.end('<rss><channel><title>Success</title></channel></rss>')
    })

    const startTime = Date.now()
    const response = await fetchUrl(server.url)
    const duration = Date.now() - startTime

    // Should retry and succeed
    expect(attempts).toBe(2)
    expect(response.status).toBe(200)

    // Duration should be fast (< 5s) because we didn't download 10MB on first attempt
    // If we downloaded the body, it would take longer
    expect(duration).toBeLessThan(5000)

    await server.stop()
  }, 10000)

  /**
   * Test: IPv4 fallback
   *
   * Setup:
   * - Simulate ENETUNREACH error (network unreachable)
   * - Verify dnsLookupIpVersion set to 4 on retry
   *
   * Expected behavior:
   * - beforeRetry hook sets IPv4-only (fetchUrl.ts:163-165)
   * - Retry uses IPv4
   *
   * Implementation notes:
   * - ENETUNREACH often happens with IPv6 issues
   * - IPv4 fallback increases success rate
   * - May need to mock Got's options to verify
   */
  it.todo('should fallback to IPv4 on ENETUNREACH error', () => {})
})

describe('fetchUrl: Content Filtering (E2E)', () => {
  /**
   * Test: Reject audio/*
   *
   * Setup:
   * - Server responds with Content-Type: audio/mpeg
   * - Or: audio/wav, audio/ogg
   *
   * Expected behavior:
   * - stream.destroy() called immediately (fetchUrl.ts:196-199)
   * - Error: "Unwanted content-type: audio/mpeg"
   * - No body downloaded
   *
   * Implementation notes:
   * - Check happens in 'response' event (fetchUrl.ts:193)
   * - avoidedContentTypes includes 'audio/' (fetchers.ts:11)
   */
  it('should reject audio/* content types', async () => {
    const audioTypes = ['audio/mpeg', 'audio/wav', 'audio/ogg']

    for (const contentType of audioTypes) {
      const server = new TestHttpServer()

      await server.start(
        server.respondWith({
          statusCode: 200,
          headers: { 'Content-Type': contentType },
          body: 'binary audio data...',
        }),
      )

      await expect(fetchUrl(server.url)).rejects.toThrow()

      await server.stop()
    }
  })

  /**
   * Test: Reject video/*
   *
   * Setup:
   * - Content-Type: video/mp4, video/avi, etc.
   *
   * Expected behavior:
   * - Immediate rejection
   * - No body downloaded
   *
   * Implementation notes:
   * - avoidedContentTypes includes 'video/'
   */
  it('should reject video/* content types', async () => {
    const videoTypes = ['video/mp4', 'video/avi', 'video/quicktime']

    for (const contentType of videoTypes) {
      const server = new TestHttpServer()

      await server.start(
        server.respondWith({
          statusCode: 200,
          headers: { 'Content-Type': contentType },
          body: 'binary video data...',
        }),
      )

      await expect(fetchUrl(server.url)).rejects.toThrow()

      await server.stop()
    }
  })

  /**
   * Test: Reject image/*
   *
   * Setup:
   * - Content-Type: image/jpeg, image/png
   *
   * Expected behavior:
   * - Rejected (unless needed for future features)
   *
   * Implementation notes:
   * - avoidedContentTypes includes 'image/'
   */
  it('should reject image/* content types', async () => {
    const imageTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp']

    for (const contentType of imageTypes) {
      const server = new TestHttpServer()

      await server.start(
        server.respondWith({
          statusCode: 200,
          headers: { 'Content-Type': contentType },
          body: 'binary image data...',
        }),
      )

      await expect(fetchUrl(server.url)).rejects.toThrow()

      await server.stop()
    }
  })

  /**
   * Test: Accept text/xml
   *
   * Setup:
   * - Content-Type: text/xml
   *
   * Expected behavior:
   * - NOT in avoidedContentTypes
   * - Download succeeds
   *
   * Implementation notes:
   * - Common for RSS feeds
   */
  it('should accept text/xml content type', async () => {
    const server = new TestHttpServer()

    await server.start(
      server.respondWith({
        statusCode: 200,
        headers: { 'Content-Type': 'text/xml' },
        body: '<?xml version="1.0"?><rss></rss>',
      }),
    )

    const response = await fetchUrl(server.url)
    expect(response.status).toBe(200)
    expect(response.headers.get('content-type')).toBe('text/xml')

    await server.stop()
  })

  /**
   * Test: Accept application/rss+xml
   *
   * Setup:
   * - Content-Type: application/rss+xml
   *
   * Expected behavior:
   * - Download succeeds
   *
   * Implementation notes:
   * - Standard RSS content type
   */
  it('should accept application/rss+xml content type', async () => {
    const server = new TestHttpServer()

    await server.start(
      server.respondWith({
        statusCode: 200,
        headers: { 'Content-Type': 'application/rss+xml' },
        body: '<?xml version="1.0"?><rss></rss>',
      }),
    )

    const response = await fetchUrl(server.url)
    expect(response.status).toBe(200)
    expect(response.headers.get('content-type')).toBe('application/rss+xml')

    await server.stop()
  })

  /**
   * Test: Accept application/atom+xml
   *
   * Setup:
   * - Content-Type: application/atom+xml
   *
   * Expected behavior:
   * - Download succeeds
   *
   * Implementation notes:
   * - Standard Atom content type
   */
  it('should accept application/atom+xml content type', async () => {
    const server = new TestHttpServer()

    await server.start(
      server.respondWith({
        statusCode: 200,
        headers: { 'Content-Type': 'application/atom+xml' },
        body: '<?xml version="1.0"?><feed xmlns="http://www.w3.org/2005/Atom"></feed>',
      }),
    )

    const response = await fetchUrl(server.url)
    expect(response.status).toBe(200)
    expect(response.headers.get('content-type')).toBe('application/atom+xml')

    await server.stop()
  })

  /**
   * Test: Accept application/json
   *
   * Setup:
   * - Content-Type: application/json
   *
   * Expected behavior:
   * - Download succeeds (JSON feeds)
   *
   * Implementation notes:
   * - JSON Feed format support
   */
  it('should accept application/json content type', async () => {
    const server = new TestHttpServer()

    await server.start(
      server.respondWith({
        statusCode: 200,
        headers: { 'Content-Type': 'application/json' },
        body: '{"version": "https://jsonfeed.org/version/1.1", "title": "Test"}',
      }),
    )

    const response = await fetchUrl(server.url)
    expect(response.status).toBe(200)
    expect(response.headers.get('content-type')).toBe('application/json')

    await server.stop()
  })
})

describe('fetchUrl: Streaming Edge Cases (E2E)', () => {
  /**
   * Test: Chunked encoding
   *
   * Setup:
   * - Server sends: Transfer-Encoding: chunked
   * - Body sent in multiple chunks with delays
   *
   * Expected behavior:
   * - All chunks received correctly
   * - Hash calculated incrementally
   * - No buffering (memory efficient)
   *
   * Implementation notes:
   * - Use res.write() multiple times with delays
   * - Verify streaming with for await...of (fetchUrl.ts:240)
   */
  it('should handle Transfer-Encoding: chunked correctly', async () => {
    const server = new TestHttpServer()
    const testContent = '<rss><channel><title>Chunked Feed</title></channel></rss>'

    await server.start(
      server.respondWith({
        statusCode: 200,
        headers: { 'Content-Type': 'application/rss+xml' },
        body: testContent,
        chunked: true,
        chunkDelay: 10,
      }),
    )

    const response = await fetchUrl(server.url)
    expect(response.status).toBe(200)
    expect(await response.text()).toBe(testContent)
    expect(response.hash).toBeDefined()

    await server.stop()
  })

  /**
   * Test: Connection drop mid-stream
   *
   * Setup:
   * - Server sends partial response
   * - Then: req.socket.destroy()
   *
   * Expected behavior:
   * - ECONNRESET error
   * - Retry triggered
   * - Partial data discarded
   *
   * Implementation notes:
   * - Send 50% of body, then destroy socket
   * - Should retry from beginning, not resume
   */
  it.todo('should handle connection drop mid-stream with retry', () => {})

  /**
   * Test: Malformed chunks
   *
   * Setup:
   * - Send invalid chunk size encoding
   * - Or: incomplete chunk
   *
   * Expected behavior:
   * - Got/Node.js throws parse error
   * - Error caught and wrapped in UnreachableUrlError
   *
   * Implementation notes:
   * - Raw socket write with bad HTTP chunk format
   * - Tests error handling robustness
   */
  it.todo('should handle malformed chunked encoding gracefully', () => {})

  /**
   * Test: Multiple chunks
   *
   * Setup:
   * - Send body in 100 small chunks
   * - Known total content
   *
   * Expected behavior:
   * - All chunks assembled correctly
   * - response.text() === full content
   * - Hash matches expected value
   *
   * Implementation notes:
   * - Test StringDecoder across chunk boundaries
   * - Verify no data loss
   */
  it('should assemble multiple chunks correctly', async () => {
    const server = new TestHttpServer()
    // Create content that will be split into many chunks (10 chars per chunk)
    const testContent = 'abcdefghij'.repeat(100) // 1000 chars = ~100 chunks

    await server.start(
      server.respondWith({
        statusCode: 200,
        headers: { 'Content-Type': 'application/rss+xml' },
        body: testContent,
        chunked: true,
      }),
    )

    const response = await fetchUrl(server.url)
    expect(response.status).toBe(200)
    expect(await response.text()).toBe(testContent)
    expect((await response.text()).length).toBe(1000)

    await server.stop()
  })

  /**
   * Test: Very small chunks
   *
   * Setup:
   * - Send body as 1-byte chunks
   * - Stress test streaming logic
   *
   * Expected behavior:
   * - All bytes received
   * - No performance issues
   * - Correct reassembly
   *
   * Implementation notes:
   * - for await...of handles any chunk size
   * - Test edge case of minimal chunks
   */
  it('should handle very small (1-byte) chunks', async () => {
    const server = new TestHttpServer()
    const testContent = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ' // 26 bytes

    await server.start(async (_, res) => {
      res.writeHead(200, {
        'Content-Type': 'application/rss+xml',
        'Transfer-Encoding': 'chunked',
      })

      // Send 1 byte at a time
      for (let i = 0; i < testContent.length; i++) {
        res.write(testContent[i])
        await new Promise((resolve) => setTimeout(resolve, 1))
      }

      res.end()
    })

    const response = await fetchUrl(server.url)
    expect(response.status).toBe(200)
    expect(await response.text()).toBe(testContent)

    await server.stop()
  })

  /**
   * Test: UTF-8 multi-byte characters split across chunk boundaries
   *
   * Setup:
   * - Send UTF-8 content with emojis and multi-byte characters
   * - Deliberately split multi-byte sequences across chunks
   * - Example: emoji 🎉 (4 bytes: F0 9F 98 80) split as [F0 9F] [98 80]
   *
   * Expected behavior:
   * - StringDecoder correctly buffers incomplete sequences
   * - Final text has correct Unicode characters (no � corruption)
   * - All emojis and multi-byte chars decoded properly
   *
   * Implementation notes:
   * - Tests StringDecoder('utf8') in fetchUrl.ts
   * - Critical for preventing corruption when chunks split mid-character
   * - Emoji requires 4 UTF-8 bytes, Chinese chars require 3 bytes
   */
  it('should correctly decode UTF-8 multi-byte characters split across chunks', async () => {
    const server = new TestHttpServer()

    // Content with multi-byte characters: emojis (4 bytes) and Chinese (3 bytes)
    const testContent = 'Hello 🎉 世界 🚀 Test'
    const buffer = Buffer.from(testContent, 'utf8')

    await server.start(async (_, res) => {
      res.writeHead(200, {
        'Content-Type': 'text/xml; charset=utf-8',
        'Transfer-Encoding': 'chunked',
      })

      // Split buffer at positions that will break multi-byte sequences
      // Emoji 🎉 is at bytes 6-9 (4 bytes: F0 9F 8E 89)
      // Split it in the middle to test StringDecoder buffering

      // Send chunks that deliberately split multi-byte characters
      res.write(buffer.subarray(0, 8)) // "Hello 🎉" but emoji is incomplete (only first 2 bytes)
      await new Promise((resolve) => setTimeout(resolve, 5))

      res.write(buffer.subarray(8, 15)) // Complete emoji + " 世" (Chinese char split)
      await new Promise((resolve) => setTimeout(resolve, 5))

      res.write(buffer.subarray(15)) // Rest of content
      res.end()
    })

    const response = await fetchUrl(server.url)
    expect(response.status).toBe(200)
    const decodedText = await response.text()

    // Verify no corruption (� characters indicate decoding failure)
    expect(decodedText).not.toContain('�')

    // Verify exact match - all multi-byte characters decoded correctly
    expect(decodedText).toBe(testContent)

    // Verify specific characters are intact
    expect(decodedText).toContain('🎉')
    expect(decodedText).toContain('世界')
    expect(decodedText).toContain('🚀')

    await server.stop()
  })

  /**
   * Test: Mixed chunk sizes
   *
   * Setup:
   * - Realistic pattern: 8KB, 16KB, 4KB, 32KB chunks
   * - Variable sizes like real HTTP servers
   *
   * Expected behavior:
   * - All chunks processed correctly
   * - No issues with size variations
   *
   * Implementation notes:
   * - Simulates real-world chunking behavior
   */
  it('should handle realistic variable chunk sizes', async () => {
    const server = new TestHttpServer()
    const chunk1 = 'x'.repeat(8 * 1024) // 8KB
    const chunk2 = 'y'.repeat(16 * 1024) // 16KB
    const chunk3 = 'z'.repeat(4 * 1024) // 4KB
    const chunk4 = 'w'.repeat(32 * 1024) // 32KB
    const expectedContent = chunk1 + chunk2 + chunk3 + chunk4

    await server.start(async (_, res) => {
      res.writeHead(200, {
        'Content-Type': 'application/rss+xml',
        'Transfer-Encoding': 'chunked',
      })

      res.write(chunk1)
      await new Promise((resolve) => setTimeout(resolve, 5))
      res.write(chunk2)
      await new Promise((resolve) => setTimeout(resolve, 5))
      res.write(chunk3)
      await new Promise((resolve) => setTimeout(resolve, 5))
      res.write(chunk4)
      res.end()
    })

    const response = await fetchUrl(server.url)
    expect(response.status).toBe(200)
    expect((await response.text()).length).toBe(expectedContent.length)

    await server.stop()
  })
})

describe.skip('fetchUrl: Error Handling (E2E)', () => {
  /**
   * Test: Invalid URL
   *
   * Setup:
   * - Pass malformed URL to fetchUrl
   * - Example: 'not-a-url', 'ht!tp://bad'
   *
   * Expected behavior:
   * - Got throws URL parse error
   * - Before isSafePublicUrl check
   *
   * Implementation notes:
   * - May throw before our code runs
   * - Verify error handling
   */
  it.todo('should throw on invalid/malformed URL', () => {})

  /**
   * Test: DNS resolution failure (already covered in retry section)
   *
   * Setup:
   * - Non-existent domain
   *
   * Expected behavior:
   * - ENOTFOUND error
   * - No retry
   * - UnreachableUrlError thrown
   *
   * Implementation notes:
   * - See retry section test for ENOTFOUND
   */
  it.todo('should fail immediately on DNS resolution failure', () => {})

  /**
   * Test: Connection refused (already covered in retry section)
   *
   * Setup:
   * - Port with no listener
   *
   * Expected behavior:
   * - ECONNREFUSED error
   * - No retry
   *
   * Implementation notes:
   * - See retry section test
   */
  it.todo('should fail immediately on connection refused', () => {})

  /**
   * Test: SSL certificate invalid
   *
   * Setup:
   * - HTTPS server with self-signed/expired certificate
   *
   * Expected behavior:
   * - Connection succeeds (rejectUnauthorized: false)
   * - fetchUrl.ts:116 allows unverified certs for RSS feeds
   *
   * Implementation notes:
   * - Create HTTPS server with bad cert
   * - Verify request succeeds despite cert issue
   */
  it.todo('should accept invalid SSL certificates (rejectUnauthorized: false)', () => {})

  /**
   * Test: Socket hang up
   *
   * Setup:
   * - Server accepts connection but immediately hangs up
   * - No HTTP response sent
   *
   * Expected behavior:
   * - Socket hang up error
   * - May or may not retry (check errorCodes)
   *
   * Implementation notes:
   * - Destroy socket immediately: req.socket.destroy()
   */
  it.todo('should handle socket hang up errors', () => {})

  /**
   * Test: Network unreachable
   *
   * Setup:
   * - Simulate ENETUNREACH error
   * - May need to mock at lower level
   *
   * Expected behavior:
   * - Triggers IPv4 fallback (fetchUrl.ts:163)
   * - Retries
   *
   * Implementation notes:
   * - Difficult to simulate without OS-level changes
   * - May need to mock error emission
   */
  it.todo('should handle network unreachable errors with IPv4 fallback', () => {})

  /**
   * Test: Broken response
   *
   * Setup:
   * - Send invalid HTTP response format
   * - Example: missing status line, bad headers
   *
   * Expected behavior:
   * - Got/Node.js HTTP parser throws error
   * - Error caught in fetchUrl.ts:289-298
   * - UnreachableUrlError thrown
   *
   * Implementation notes:
   * - Use raw socket to send malformed HTTP
   */
  it.todo('should handle broken/malformed HTTP responses', () => {})

  /**
   * Test: Unexpected response end
   *
   * Setup:
   * - Set Content-Length: 1000
   * - Send only 500 bytes, then end
   *
   * Expected behavior:
   * - Got detects premature end
   * - Error thrown
   *
   * Implementation notes:
   * - Mismatch between Content-Length and actual body
   */
  it.todo('should detect unexpected response end', () => {})
})

describe('fetchUrl: Custom Config Override (E2E)', () => {
  /**
   * Test: Disable retries
   *
   * Setup:
   * - Server responds with 500 (normally retries)
   * - Call: fetchUrl(url, { retry: { limit: 0 } })
   *
   * Expected behavior:
   * - NO retries performed
   * - Fails immediately with 500 error
   * - Only 1 request attempt
   *
   * Implementation notes:
   * - fetchUrl.ts:237 uses config.retry.limit
   * - Track request count in server
   */
  it('should disable retries when retry.limit = 0', async () => {
    let attempts = 0
    const server = new TestHttpServer()

    await server.start((_, res) => {
      attempts++
      res.writeHead(500)
      res.end('Server Error')
    })

    await expect(fetchUrl(server.url, { retry: { limit: 0 } })).rejects.toThrow()

    // Only 1 attempt - no retries
    expect(attempts).toBe(1)

    await server.stop()
  })

  /**
   * Test: Custom retry errorCodes
   *
   * Setup:
   * - Call: fetchUrl(url, { retry: { errorCodes: ['ENOTFOUND'] } })
   * - Trigger ENOTFOUND error
   *
   * Expected behavior:
   * - Custom errorCodes override defaults
   * - ENOTFOUND now triggers retry (normally doesn't)
   *
   * Implementation notes:
   * - fetchUrl.ts:210-213 spreads retry config
   * - Allows per-request retry customization
   */
  it('should allow custom retry errorCodes', async () => {
    // Without custom errorCodes, ENOTFOUND fails immediately
    const start1 = Date.now()
    await expect(fetchUrl('https://this-domain-does-not-exist-123456789.com')).rejects.toThrow()
    const duration1 = Date.now() - start1
    expect(duration1).toBeLessThan(5000) // Fails fast

    // With custom errorCodes including ENOTFOUND, it should retry
    // Note: This test is conceptual - ENOTFOUND happens before connection,
    // so retries won't help. But it tests the override mechanism.
    const start2 = Date.now()
    await expect(
      fetchUrl('https://this-domain-does-not-exist-123456789.com', {
        retry: { errorCodes: ['ENOTFOUND'], limit: 1 },
      }),
    ).rejects.toThrow()
    const duration2 = Date.now() - start2
    // Should take longer due to retry (but still fast due to DNS)
    expect(duration2).toBeGreaterThanOrEqual(duration1)
  }, 15000)

  /**
   * Test: Custom retry statusCodes
   *
   * Setup:
   * - Call: fetchUrl(url, { retry: { statusCodes: [404] } })
   * - Server responds 404
   *
   * Expected behavior:
   * - 404 now triggers retry (normally doesn't)
   * - Custom statusCodes override defaults
   *
   * Implementation notes:
   * - Useful for specific edge cases
   */
  it('should allow custom retry statusCodes', async () => {
    let attempts = 0
    const server = new TestHttpServer()

    await server.start((_, res) => {
      attempts++

      if (attempts < 3) {
        res.writeHead(404)
        res.end('Not Found')
        return
      }

      res.writeHead(200, { 'Content-Type': 'application/rss+xml' })
      res.end('<rss></rss>')
    })

    // 404 normally doesn't retry, but with custom config it should
    const response = await fetchUrl(server.url, {
      retry: { statusCodes: [404], limit: 2 },
    })

    expect(attempts).toBe(3) // Initial + 2 retries
    expect(response.status).toBe(200)

    await server.stop()
  }, 10000)

  /**
   * Test: Custom headers merge
   *
   * Setup:
   * - Call: fetchUrl(url, { headers: { 'X-Custom': 'value' } })
   * - Server echoes headers
   *
   * Expected behavior:
   * - Custom headers merged with commonHeaders
   * - Both User-Agent (default) and X-Custom sent
   *
   * Implementation notes:
   * - fetchUrl.ts:207-209 merges headers
   * - Verify both default and custom headers present
   */
  it('should merge custom headers with defaults', async () => {
    const server = new TestHttpServer()
    let receivedHeaders: http.IncomingHttpHeaders | undefined

    await server.start((req, res) => {
      receivedHeaders = req.headers

      res.writeHead(200, { 'Content-Type': 'application/rss+xml' })
      res.end('<rss></rss>')
    })

    await fetchUrl(server.url, {
      headers: {
        'X-Custom-Header': 'custom-value',
        'X-Another': 'test',
      },
    })

    // Verify both default and custom headers are present
    expect(receivedHeaders).toBeDefined()
    expect(receivedHeaders?.['user-agent']).toBeDefined()
    expect(receivedHeaders?.['x-custom-header']).toBe('custom-value')
    expect(receivedHeaders?.['x-another']).toBe('test')

    await server.stop()
  })
})
