import type { IncomingHttpHeaders } from 'node:http'
import https from 'node:https'
import CacheableLookup from 'cacheable-lookup'
import got, { type Response as GotResponse } from 'got'
import {
  avoidedContentTypes,
  commonHeaders,
  defaultMaxContentSize,
  defaultMaxRetries,
  defaultRetryableErrorCodes,
  defaultRetryableStatusCodes,
  maxHeaderSize,
  maxRedirects,
  maxTimeout,
  userAgents,
} from '../constants/fetchers.ts'
import { ContentSizeError } from '../errors/ContentSizeError.ts'
import { UnreachableUrlError } from '../errors/UnreachableUrlError.ts'
import { UnsafeUrlError } from '../errors/UnsafeUrlError.ts'
import { createStreamingChecksum } from '../helpers/hashes.ts'
import { isOneOfContentTypes } from '../helpers/responses.ts'
import { isSafePublicUrl, resolveRelativeUrl } from '../helpers/urls.ts'

// TODO:
// - Tell the server to give the uncompressed data. This is to mitigate issues where some servers
//   wrongly say they the response is gzipped where in reality it's not.
//   Solution: set 'Accept-Encoding': 'identity'.
//   Example page: ?
// - At some point, consider replacing Got with native fetch (or Unidici) for more low-level
//   control and better performance and less dependencies on external packages. It might be
//   a challenge as a lot of stuff that Got provides out of the box would need to be written
//   from scratch, but maybe it's worth it.
//
// Any alternative HTTP client must support ALL of the following features:
// 1. Timeout configuration
//    - Per-request timeout limit
//    - Current: timeout.request = maxTimeout
// 2. HTTPS Agent configuration
//    - rejectUnauthorized: false (accept unverified certificates for RSS feeds)
//    - keepAlive: true (connection pooling)
//    - maxSockets: 100 (concurrent connection limit)
//    - maxHeaderSize: 64KB (handle RSS feeds with large headers)
//    - Current: https: { rejectUnauthorized }, agent: { https }, maxHeaderSize
// 3. Always return response without throwing
//    - Must return response for non-2xx status codes (4xx, 5xx)
//    - Current: throwHttpErrors: false
// 4. Stream response type
//    - Must support streaming responses (not buffering entire response)
//    - Must support async iteration over stream chunks (for await...of)
//    - Must support stream.destroy() for aborting downloads
//    - Must support 'response' event to access headers before body download
//    - Current: gotInstance.stream(), await 'response' event, for await...of stream
// 5. Header merging
//    - Default headers merged with per-request headers
//    - Current: headers: commonHeaders + config.headers
// 6. Redirect handling
//    - Follow redirects up to maxRedirects
//    - beforeRedirect hook for SSRF validation of redirect targets
//    - Must provide: fromUrl, toUrl, ability to throw to abort redirect
//    - Current: followRedirect: true, maxRedirects, hooks.beforeRedirect
// 7. Retry logic
//    - Retry on HTTP 403 (Forbidden) with different User-Agent header
//    - Retry on network errors: ENETUNREACH, ETIMEDOUT
//    - Exponential backoff with jitter (attemptCount * 1000 + random)
//    - Limit retries to defaultMaxRetries (3)
//    - IPv4 fallback on network errors (dnsLookupIpVersion: 4)
//    - Current: retry.limit, retry.statusCodes, retry.errorCodes, hooks.beforeRetry
// 8. Response metadata
//    - Final URL after redirects (response.url)
//    - Status code (response.statusCode)
//    - Status message (response.statusMessage)
//    - Response headers (response.headers)
// 9. Global HTTP parser configuration (Node.js)
//    - Lenient HTTP parsing via Node.js --insecure-http-parser flag
//    - Required for legacy RSS feeds with malformed headers
//    - Note: This is a Node.js runtime flag, not a library feature
// 10. Error handling
//    - Network errors must expose error.code (e.g., 'ENETUNREACH', 'ETIMEDOUT')
//    - Errors must provide access to error.options for retry logic
// 11. DNS caching
//    - Cache DNS lookups with TTL to avoid repeated queries
//    - Current: dnsCache with cacheable-lookup

// The FetchUrlResponse class is necessary to simulate the native Response object behavior.
// When creating a Response object from GotResponse manually, it is necessary to also store the
// URL of fetched page so that it can be referenced later. The native Response object has it out
// of the box when performing fetch(), but when creating it manually, there's no way to set it.
export class FetchUrlResponse extends Response {
  public readonly url: string
  public readonly hash?: string
  public readonly contentBytes: number
  private readonly _body: string

  constructor(
    body: string,
    init: ResponseInit & {
      url: string
      hash?: string
      contentBytes: number
    },
  ) {
    super(undefined, init)
    this._body = body
    this.url = init.url
    this.hash = init.hash
    this.contentBytes = init.contentBytes
  }

  text(): Promise<string> {
    return Promise.resolve(this._body)
  }

  async json<T = unknown>(): Promise<T | undefined> {
    try {
      return JSON.parse(this._body) as T
    } catch {
      return undefined
    }
  }
}

const gotInstance = got.extend({
  // Allows getting RSS feed from URLs with unverified certificate.
  https: { rejectUnauthorized: false },
  // Enable connection pooling for better performance.
  agent: { https: new https.Agent({ keepAlive: true, maxSockets: 100 }) },
  // Cache DNS lookups to improve performance (respects TTL).
  dnsCache: new CacheableLookup(),
  // Always return a response instead of throwing an exception. This allows for later use
  // of the erroneous response to detect the type of error in parsing middlewares.
  throwHttpErrors: false,
  // Increase max header size to 64KB for RSS feeds with large headers.
  maxHeaderSize,
  // Default headers (will be merged with per-request headers)
  headers: commonHeaders,
  timeout: { request: maxTimeout },
  retry: { limit: 0 },
  followRedirect: true,
  isStream: true,
  maxRedirects,
  hooks: {
    beforeRedirect: [
      (_, response) => {
        const fromUrl = response.requestUrl.toString()
        const toUrl = response.headers.location
        const toResolvedUrl = toUrl ? resolveRelativeUrl(toUrl, fromUrl) : ''

        // TODO: This could be optimized by skipping the relative URL redirects, as we already
        // verified the initial absolute URL. For the simplicity's sake, let's keep it as is.
        if (!isSafePublicUrl(toResolvedUrl)) {
          console.warn('[SECURITY] SSRF blocked: redirect to internal resource', {
            from: fromUrl,
            to: toUrl,
            toResolved: toResolvedUrl,
          })
          throw new UnsafeUrlError(toResolvedUrl)
        }
      },
    ],
  },
})

export type FetchUrlOptions = {
  retry?: {
    limit?: number
    errorCodes?: Array<string>
    statusCodes?: Array<number>
  }
  headers?: Record<string, string>
  maxContentSize?: number
}

type FetchUrlAttemptOptions = FetchUrlOptions & {
  dnsLookupIpVersion?: 4 | 6
}

type FetchUrl = (url: string, options?: FetchUrlOptions) => Promise<FetchUrlResponse>

type FetchUrlAttempt = (url: string, options?: FetchUrlAttemptOptions) => Promise<FetchUrlResponse>

const getDeclaredContentLength = (response: GotResponse) => {
  const contentLength = Number(response.headers['content-length'])
  return Number.isFinite(contentLength) ? contentLength : -1
}

const toHeaders = (raw: IncomingHttpHeaders) => {
  const headers = new Headers()

  for (const [key, valueOrValues] of Object.entries(raw)) {
    if (valueOrValues == null) {
      continue
    }

    if (Array.isArray(valueOrValues)) {
      for (const value of valueOrValues) {
        headers.append(key, String(value))
      }
    } else {
      headers.set(key, String(valueOrValues))
    }
  }

  return headers
}

const fetchUrlAttempt: FetchUrlAttempt = async (url, options) => {
  const stream = gotInstance.stream(url, {
    headers: {
      ...gotInstance.defaults.options.headers,
      ...options?.headers,
    },
    dnsLookupIpVersion: options?.dnsLookupIpVersion,
  })

  const response = await new Promise<GotResponse>((resolve, reject) => {
    stream.once('response', resolve)
    stream.once('error', reject)
  })

  // Skip body download for retryable statuses to save bandwidth and memory.
  const status = response.statusCode ?? 0
  const retryableStatusCodes = options?.retry?.statusCodes ?? defaultRetryableStatusCodes
  const isRetryableStatus = retryableStatusCodes.includes(status)

  if (isRetryableStatus) {
    stream.destroy()

    return new FetchUrlResponse('', {
      url: response.url,
      status,
      statusText: response.statusMessage,
      headers: toHeaders(response.headers),
      contentBytes: 0,
    })
  }

  const contentType = String(response.headers['content-type'])

  if (isOneOfContentTypes(contentType, avoidedContentTypes)) {
    stream.destroy()
    throw new Error(`Unwanted content-type: ${contentType}`)
  }

  const hash = createStreamingChecksum()
  const chunks: Array<Buffer> = []
  const contentSizeLimit = options?.maxContentSize ?? defaultMaxContentSize
  const declaredContentSize = getDeclaredContentLength(response)

  let downloadedBytes = 0

  // TODO: Disable transparent decompression to make Content-Length checks deterministic.
  // Currently, if server sends gzipped response, Content-Length reflects compressed size
  // but downloadedBytes reflects uncompressed size, causing mismatches. Fix by setting
  // decompress: false and 'accept-encoding': 'identity' in stream options.
  // Related to TODO at line 24 about compression issues.
  if (declaredContentSize > contentSizeLimit) {
    stream.destroy()
    throw new ContentSizeError(url, contentSizeLimit, declaredContentSize, true)
  }

  for await (const chunk of stream) {
    downloadedBytes += chunk.length

    if (downloadedBytes > contentSizeLimit) {
      stream.destroy()
      throw new ContentSizeError(url, contentSizeLimit, downloadedBytes, false)
    }

    hash.update(chunk)
    chunks.push(chunk)
  }

  let buffer: Buffer | undefined = Buffer.concat(chunks, downloadedBytes)
  chunks.length = 0
  const body = buffer.toString('utf8')
  buffer = undefined

  return new FetchUrlResponse(body, {
    url: response.url,
    status: response.statusCode,
    statusText: response.statusMessage,
    headers: toHeaders(response.headers),
    hash: hash.digest(),
    contentBytes: downloadedBytes,
  })
}

const applyBackoff = async (attempt: number) => {
  const backoff = Math.min(2 ** attempt * 1000, 64000) + Math.random() * 1000
  await new Promise((resolve) => setTimeout(resolve, backoff))
}

export const fetchUrl: FetchUrl = async (url, options) => {
  if (!isSafePublicUrl(url)) {
    console.warn('[fetchUrl] SSRF blocked:', { url })
    throw new UnsafeUrlError(url)
  }

  const maxRetries = options?.retry?.limit ?? defaultMaxRetries
  const retryableStatusCodes = options?.retry?.statusCodes ?? defaultRetryableStatusCodes
  const retryableErrorCodes = options?.retry?.errorCodes ?? defaultRetryableErrorCodes

  let lastError: Error | undefined
  const currentOptions: FetchUrlAttemptOptions = { ...options }

  console.debug('[fetchUrl] Starting:', {
    url,
    headers: options?.headers,
    maxAttempts: maxRetries + 1,
  })

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    const canRetryMore = attempt < maxRetries

    try {
      const result = await fetchUrlAttempt(url, currentOptions)

      const isRetryableStatus = retryableStatusCodes.includes(result.status)
      const isForbiddenStatus = result.status === 403

      if (isRetryableStatus && canRetryMore) {
        console.debug('[fetchUrl] Retrying due to status code:', {
          url,
          status: result.status,
          attempt: attempt + 1,
          maxAttempts: maxRetries + 1,
        })

        // Rotate User-Agent on 403.
        if (isForbiddenStatus) {
          currentOptions.headers = {
            ...currentOptions.headers,
            'user-agent': userAgents[attempt % userAgents.length],
          }
        }

        await applyBackoff(attempt)
        continue
      }

      if (isRetryableStatus && !canRetryMore) {
        console.error('[fetchUrl] Retries exhausted with retryable status:', {
          url,
          status: result.status,
          attempts: attempt + 1,
        })
        const error = new Error(`HTTP ${result.status}: ${result.statusText}`)
        throw new UnreachableUrlError(url, error)
      }

      // Success or non-retryable status code.
      console.debug('[fetchUrl] Success:', {
        url,
        finalUrl: result.url,
        status: result.status,
        contentBytes: result.contentBytes,
        hash: result.hash,
        attempts: attempt + 1,
      })

      return result
    } catch (error) {
      lastError = error as Error

      const errorCode = (error as any).code
      const isRetryableError = retryableErrorCodes.includes(errorCode)
      const isPossibleIpError = errorCode === 'ENETUNREACH'

      if (isRetryableError && canRetryMore) {
        console.debug('[fetchUrl] Retrying due to error:', {
          url,
          errorCode,
          errorMessage: lastError.message,
          attempt: attempt + 1,
          maxAttempts: maxRetries + 1,
        })

        // IPv4 fallback on network unreachable.
        if (isPossibleIpError) {
          currentOptions.dnsLookupIpVersion = 4
        }

        await applyBackoff(attempt)
        continue
      }

      console.error('[fetchUrl] Failed:', {
        url,
        errorType: lastError.constructor.name,
        errorMessage: lastError.message,
        errorCode,
        attempts: attempt + 1,
        stack: lastError.stack?.split('\n').slice(0, 3).join('\n'),
      })
      throw new UnreachableUrlError(url, lastError)
    }
  }

  throw new UnreachableUrlError(url, lastError)
}
