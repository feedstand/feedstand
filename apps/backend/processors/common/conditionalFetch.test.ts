/**
 * Test suite for conditionalFetch processor
 *
 * NOTE: These tests require UNSAFE_DISABLE_SSRF_CHECK=true environment variable
 * to allow localhost connections. This is only safe in isolated test environments.
 * DO NOT set this variable in production - it disables SSRF protection for localhost.
 */

import type http from 'node:http'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { NotModifiedError } from '../../errors/NotModifiedError.ts'
import { TestHttpServer } from '../../helpers/tests.ts'
import type { WorkflowContext } from '../../helpers/workflows.ts'
import type { Channel } from '../../types/schemas.ts'
import { conditionalFetch } from './conditionalFetch.ts'

describe('conditionalFetch', () => {
  let server: TestHttpServer

  beforeEach(() => {
    server = new TestHttpServer()
  })

  afterEach(async () => {
    await server.stop()
  })

  /**
   * Test: Conditional GET with If-None-Match (ETag).
   *
   * Setup:
   * - Server returns 304 Not Modified when ETag matches.
   * - Server returns 200 OK when ETag doesn't match.
   *
   * Expected behavior:
   * - If-None-Match header sent with ETag value.
   * - 304 response throws NotModifiedError with response attached.
   * - Empty body returned for 304.
   */
  it('should send If-None-Match header and recognize 304', async () => {
    let receivedHeaders: http.IncomingHttpHeaders | undefined

    await server.start((req, res) => {
      receivedHeaders = req.headers

      if (req.headers['if-none-match'] === '"abc123"') {
        res.writeHead(304, {
          ETag: '"abc123"',
          'Content-Type': 'application/rss+xml',
        })
        res.end()
      } else {
        res.writeHead(200, {
          ETag: '"xyz789"',
          'Content-Type': 'application/rss+xml',
        })
        res.end('<rss><channel><title>Updated</title></channel></rss>')
      }
    })

    // Test with matching ETag - should get 304.
    const context1: WorkflowContext<unknown> = {
      url: server.url,
      channel: { lastScanEtag: '"abc123"' } as Channel,
    }
    const processor = conditionalFetch('lastScanEtag', 'lastScanLastModified')
    await processor(
      context1,
      async () => {},
      async () => ({}) as never,
    )

    expect(receivedHeaders?.['if-none-match']).toBe('"abc123"')
    expect(context1.error).toBeInstanceOf(NotModifiedError)
    expect((context1.error as NotModifiedError).response.status).toBe(304)
    expect(await (context1.error as NotModifiedError).response.text()).toBe('')
    expect((context1.error as NotModifiedError).response.headers.get('etag')).toBe('"abc123"')

    // Test with different ETag - should get 200.
    const context2: WorkflowContext<unknown> = {
      url: server.url,
      channel: { lastScanEtag: '"old-etag"' } as Channel,
    }
    await processor(
      context2,
      async () => {},
      async () => ({}) as never,
    )

    expect(receivedHeaders?.['if-none-match']).toBe('"old-etag"')
    expect(context2.response?.status).toBe(200)
    expect(await context2.response?.text()).toContain('Updated')
  })

  /**
   * Test: Conditional GET with If-Modified-Since.
   *
   * Setup:
   * - Server returns 304 when If-Modified-Since matches Last-Modified.
   * - Server returns 200 when content has been modified since given date.
   *
   * Expected behavior:
   * - If-Modified-Since header sent with server's exact Last-Modified value.
   * - 304 response recognized.
   * - FRB012: Use server's exact string, don't modify it.
   */
  it('should send If-Modified-Since header and recognize 304', async () => {
    let receivedHeaders: http.IncomingHttpHeaders | undefined
    const lastModified = 'Wed, 01 Jan 2024 12:00:00 GMT'

    await server.start((req, res) => {
      receivedHeaders = req.headers

      if (req.headers['if-modified-since'] === lastModified) {
        res.writeHead(304, {
          'Last-Modified': lastModified,
          'Content-Type': 'application/rss+xml',
        })
        res.end()
      } else {
        res.writeHead(200, {
          'Last-Modified': new Date().toUTCString(),
          'Content-Type': 'application/rss+xml',
        })
        res.end('<rss><channel><title>Updated</title></channel></rss>')
      }
    })

    // Test with matching date - should get 304.
    const context1: WorkflowContext<unknown> = {
      url: server.url,
      channel: { lastScanLastModified: lastModified } as Channel,
    }
    const processor = conditionalFetch('lastScanEtag', 'lastScanLastModified')
    await processor(
      context1,
      async () => {},
      async () => ({}) as never,
    )

    expect(receivedHeaders?.['if-modified-since']).toBe(lastModified)
    expect(context1.error).toBeInstanceOf(NotModifiedError)
    expect((context1.error as NotModifiedError).response.status).toBe(304)
    expect(await (context1.error as NotModifiedError).response.text()).toBe('')

    // Test with old date - should get 200.
    const oldLastModified = 'Mon, 01 Jan 2020 00:00:00 GMT'
    const context2: WorkflowContext<unknown> = {
      url: server.url,
      channel: { lastScanLastModified: oldLastModified } as Channel,
    }
    await processor(
      context2,
      async () => {},
      async () => ({}) as never,
    )

    expect(receivedHeaders?.['if-modified-since']).toBe(oldLastModified)
    expect(context2.response?.status).toBe(200)
  })

  /**
   * Test: Both ETag and Last-Modified (atomic set per FRB014).
   *
   * Setup:
   * - Server checks both If-None-Match AND If-Modified-Since.
   * - Returns 304 only if both match.
   *
   * Expected behavior:
   * - Both headers sent when both provided.
   * - FRB014: ETag and Last-Modified are atomic set.
   * - FRB012: Send server's exact Last-Modified string.
   */
  it('should send both If-None-Match and If-Modified-Since when both provided', async () => {
    let receivedHeaders: http.IncomingHttpHeaders | undefined
    const etag = '"abc123"'
    const lastModified = 'Wed, 01 Jan 2024 12:00:00 GMT'

    await server.start((req, res) => {
      receivedHeaders = req.headers

      const etagMatches = req.headers['if-none-match'] === etag
      const dateMatches = req.headers['if-modified-since'] === lastModified

      if (etagMatches && dateMatches) {
        res.writeHead(304, {
          ETag: etag,
          'Last-Modified': lastModified,
          'Content-Type': 'application/rss+xml',
        })
        res.end()
      } else {
        res.writeHead(200, {
          ETag: '"xyz789"',
          'Last-Modified': new Date().toUTCString(),
          'Content-Type': 'application/rss+xml',
        })
        res.end('<rss></rss>')
      }
    })

    const context: WorkflowContext<unknown> = {
      url: server.url,
      channel: {
        lastScanEtag: etag,
        lastScanLastModified: lastModified,
      } as Channel,
    }
    const processor = conditionalFetch('lastScanEtag', 'lastScanLastModified')
    await processor(
      context,
      async () => {},
      async () => ({}) as never,
    )

    // FRB014: Both headers sent as atomic set.
    expect(receivedHeaders?.['if-none-match']).toBe(etag)
    expect(receivedHeaders?.['if-modified-since']).toBe(lastModified)
    expect(context.error).toBeInstanceOf(NotModifiedError)
    expect((context.error as NotModifiedError).response.status).toBe(304)
  })

  /**
   * Test: No cache headers on first request.
   *
   * Setup:
   * - Channel has no ETag or Last-Modified stored.
   *
   * Expected behavior:
   * - No If-None-Match header sent.
   * - No If-Modified-Since header sent.
   * - Always get 200 response.
   */
  it('should not send cache headers when channel has no cached values', async () => {
    let receivedHeaders: http.IncomingHttpHeaders | undefined

    await server.start((req, res) => {
      receivedHeaders = req.headers
      res.writeHead(200, {
        ETag: '"abc123"',
        'Last-Modified': new Date().toUTCString(),
        'Content-Type': 'application/rss+xml',
      })
      res.end('<rss></rss>')
    })

    const context: WorkflowContext<unknown> = {
      url: server.url,
      channel: {} as Channel,
    }
    const processor = conditionalFetch('lastScanEtag', 'lastScanLastModified')
    await processor(
      context,
      async () => {},
      async () => ({}) as never,
    )

    expect(receivedHeaders?.['if-none-match']).toBeUndefined()
    expect(receivedHeaders?.['if-modified-since']).toBeUndefined()
    expect(context.response?.status).toBe(200)
  })

  /**
   * Test: FRB051 compliance - Uses GET, not HEAD.
   *
   * Setup:
   * - Monitor HTTP method used.
   *
   * Expected behavior:
   * - Uses GET method (conditional GET).
   * - Never uses HEAD method.
   * - Server returns 304 with empty body for conditional GET.
   */
  it('should use GET method for conditional requests (FRB051)', async () => {
    let receivedMethod: string | undefined

    await server.start((req, res) => {
      receivedMethod = req.method

      if (req.headers['if-none-match'] === '"abc123"') {
        res.writeHead(304, {
          ETag: '"abc123"',
        })
        res.end()
      } else {
        res.writeHead(200, {
          ETag: '"abc123"',
          'Content-Type': 'application/rss+xml',
        })
        res.end('<rss></rss>')
      }
    })

    const context: WorkflowContext<unknown> = {
      url: server.url,
      channel: { lastScanEtag: '"abc123"' } as Channel,
    }
    const processor = conditionalFetch('lastScanEtag', 'lastScanLastModified')
    await processor(
      context,
      async () => {},
      async () => ({}) as never,
    )

    // FRB051: Must use GET, not HEAD.
    expect(receivedMethod).toBe('GET')
  })

  /**
   * Test: 304 response preserves headers.
   *
   * Setup:
   * - Server returns 304 with ETag, Last-Modified, Cache-Control headers.
   *
   * Expected behavior:
   * - All headers accessible in 304 response.
   * - Headers can be stored for future requests (per FRB014).
   */
  it('should preserve headers from 304 response', async () => {
    const etag = '"abc123"'
    const lastModified = 'Thu, 07 Nov 2024 14:32:00 GMT'

    await server.start((req, res) => {
      if (req.headers['if-none-match'] === etag) {
        res.writeHead(304, {
          ETag: etag,
          'Last-Modified': lastModified,
          'Cache-Control': 'max-age=3600',
          'Content-Type': 'application/rss+xml',
        })
        res.end()
      } else {
        res.writeHead(200, {
          'Content-Type': 'application/rss+xml',
        })
        res.end('<rss></rss>')
      }
    })

    const context: WorkflowContext<unknown> = {
      url: server.url,
      channel: { lastScanEtag: etag } as Channel,
    }
    const processor = conditionalFetch('lastScanEtag', 'lastScanLastModified')
    await processor(
      context,
      async () => {},
      async () => ({}) as never,
    )

    expect(context.error).toBeInstanceOf(NotModifiedError)
    const error = context.error as NotModifiedError
    expect(error.response.status).toBe(304)
    expect(error.response.headers.get('etag')).toBe(etag)
    expect(error.response.headers.get('last-modified')).toBe(lastModified)
    expect(error.response.headers.get('cache-control')).toBe('max-age=3600')
  })

  /**
   * Test: 304 response has zero content bytes.
   *
   * Setup:
   * - Server returns 304 with no body.
   *
   * Expected behavior:
   * - contentBytes should be 0.
   * - Body should be empty string.
   * - No bandwidth wasted.
   */
  it('should report zero content bytes for 304 response', async () => {
    await server.start((req, res) => {
      if (req.headers['if-none-match'] === '"abc123"') {
        res.writeHead(304, {
          ETag: '"abc123"',
        })
        res.end()
      } else {
        res.writeHead(200)
        res.end('<rss></rss>')
      }
    })

    const context: WorkflowContext<unknown> = {
      url: server.url,
      channel: { lastScanEtag: '"abc123"' } as Channel,
    }
    const processor = conditionalFetch('lastScanEtag', 'lastScanLastModified')
    await processor(
      context,
      async () => {},
      async () => ({}) as never,
    )

    expect(context.error).toBeInstanceOf(NotModifiedError)
    const error = context.error as NotModifiedError
    expect(error.response.status).toBe(304)
    expect(error.response.contentBytes).toBe(0)
    expect(await error.response.text()).toBe('')
  })
})
