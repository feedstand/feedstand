import https from 'node:https'
import { StringDecoder } from 'node:string_decoder'
import CacheableLookup from 'cacheable-lookup'
import got, { type Response as GotResponse, type OptionsInit, type Request } from 'got'
import { sample } from 'lodash-es'
import {
  avoidedContentTypes,
  commonHeaders,
  maxContentSize,
  maxHeaderSize,
  maxRedirects,
  maxRetries,
  maxTimeout,
  userAgents,
} from '../constants/fetchers.ts'
import { UnreachableUrlError } from '../errors/UnreachableUrlError.ts'
import { UnsafeUrlError } from '../errors/UnsafeUrlError.ts'
import { createStreamingChecksum } from '../helpers/hashes.ts'
import { isOneOfContentTypes } from '../helpers/responses.ts'
import { isJson } from '../helpers/strings.ts'
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
//    - Limit retries to maxRetries (3)
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
  private readonly _body: string

  constructor(body: string, init: ResponseInit & { url: string; hash?: string }) {
    super(undefined, init)
    this.url = init.url
    this._body = body
    this.hash = init.hash
  }

  text(): Promise<string> {
    return Promise.resolve(this._body)
  }

  json(): Promise<ReturnType<typeof JSON.parse> | undefined> {
    return isJson(this._body) ? JSON.parse(this._body) : Promise.resolve(undefined)
  }
}

const cacheable = new CacheableLookup()

const gotInstance = got.extend({
  timeout: {
    request: maxTimeout,
  },
  // Allows getting RSS feed from URLs with unverified certificate.
  https: {
    rejectUnauthorized: false,
  },
  // Enable connection pooling for better performance.
  agent: {
    https: new https.Agent({
      keepAlive: true,
      maxSockets: 100,
    }),
  },
  // Cache DNS lookups to improve performance (respects TTL).
  dnsCache: cacheable,
  // Always return a response instead of throwing an exception. This allows for later use
  // of the erroneous response to detect the type of error in parsing middlewares.
  throwHttpErrors: false,
  // Increase max header size to 64KB for RSS feeds with large headers.
  maxHeaderSize,
  // Default headers (will be merged with per-request headers)
  headers: commonHeaders,
  followRedirect: true,
  isStream: true,
  maxRedirects,
  retry: {
    limit: maxRetries,
    // Original: [403, 408, 413, 429, 500, 502, 503, 504, 521, 522, 524],
    statusCodes: [403, 408, 429, 500, 502, 503, 504, 521],
    // Only retry on transient network errors, not DNS failures or connection refused.
    errorCodes: ['ETIMEDOUT', 'ECONNRESET', 'EPIPE', 'EADDRINUSE'],
  },
  hooks: {
    beforeRedirect: [
      (_updatedOptions, response) => {
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
    beforeRetry: [
      (error) => {
        // Force IPv4-only on network error retries.
        if (error.code === 'ENETUNREACH' || error.code === 'ETIMEDOUT') {
          error.options.dnsLookupIpVersion = 4
        }

        // Rotate User-Agent on 403 retries.
        if (error.response?.statusCode === 403) {
          error.options.headers['User-Agent'] = sample(userAgents)
        }
      },
    ],
  },
})

export type FetchUrlConfig = {
  retry?: {
    limit?: number
    errorCodes?: Array<string>
    statusCodes?: Array<number>
  }
  headers?: Record<string, string>
}

type FetchUrl = (url: string, config?: FetchUrlConfig) => Promise<FetchUrlResponse>

type AttemptFetch = (
  url: string,
  config?: FetchUrlConfig,
  retryStream?: Request,
) => Promise<FetchUrlResponse>

type AttemptFetchRetryListener = (
  retryCount: number,
  error: Error,
  createRetryStream: (options?: OptionsInit) => Request,
) => void

const attemptFetch: AttemptFetch = async (url, config, retryStream) => {
  const stream =
    retryStream ??
    gotInstance.stream(url, {
      ...config,
      headers: {
        ...gotInstance.defaults.options.headers,
        ...config?.headers,
      },
      retry: {
        ...gotInstance.defaults.options.retry,
        ...config?.retry,
      },
    })

  let retryPromise: Promise<FetchUrlResponse> | undefined

  const retryListener: AttemptFetchRetryListener = (retryCount, error, createRetryStream) => {
    console.debug('[Retry triggered:', { url, retryCount, error: error.message })
    const newStream = createRetryStream()
    // Attach error handler IMMEDIATELY to prevent unhandled rejections
    newStream.on('error', () => {})
    retryPromise = attemptFetch(url, config, newStream)
    // Prevent unhandled rejection warnings - error will be handled when awaited
    retryPromise.catch(() => {})
  }
  stream.once('retry', retryListener)

  // Catch ALL error events to prevent unhandled rejections during retries
  stream.on('error', () => {
    // Errors are handled by the promise rejection or retry mechanism
  })

  try {
    // Wait for response headers before processing body.
    const response = await new Promise<GotResponse>((resolve, reject) => {
      stream.once('response', resolve)
      stream.once('error', reject)
    })
    const contentType = String(response.headers['content-type'])

    // If it's not accepted response type, abort right away and destroy the stream.
    if (isOneOfContentTypes(contentType, avoidedContentTypes)) {
      stream.destroy()
      throw new Error(`Unwanted content-type: ${contentType}`)
    }

    const hash = createStreamingChecksum()
    const decoder = new StringDecoder('utf-8')

    let body = ''
    let downloadedBytes = 0

    for await (const chunk of stream) {
      downloadedBytes += chunk.length

      if (downloadedBytes > maxContentSize) {
        stream.destroy()
        throw new Error(`Content length exceeded the limit: ${maxContentSize}`)
      }

      hash.update(chunk)
      body += decoder.write(chunk)
    }

    body += decoder.end()

    return new FetchUrlResponse(body, {
      url: response.url,
      status: response.statusCode,
      statusText: response.statusMessage,
      headers: new Headers(response.headers as Record<string, string>),
      hash: hash.digest(),
    })
  } catch (error) {
    if (retryPromise) {
      return await retryPromise
    }

    throw error
  }
}

export const fetchUrl: FetchUrl = async (url, config) => {
  if (!isSafePublicUrl(url)) {
    console.warn('[fetchUrl] SSRF blocked:', { url })
    throw new UnsafeUrlError(url)
  }

  console.debug('[fetchUrl] Starting:', { url, headers: config?.headers })

  try {
    const result = await attemptFetch(url, config)
    const bodyText = await result.text()
    console.debug('[fetchUrl] Success:', {
      url,
      finalUrl: result.url,
      status: result.status,
      contentLength: bodyText.length,
      hash: result.hash,
    })
    return result
  } catch (error) {
    console.error('[fetchUrl] Failed:', {
      url,
      errorType: (error as Error).constructor.name,
      errorMessage: (error as Error).message,
      stack: (error as Error).stack?.split('\n').slice(0, 3).join('\n'),
    })
    throw new UnreachableUrlError(url, error as Error)
  }
}
