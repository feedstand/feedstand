import https from 'node:https'
import axios, { type AxiosError, type AxiosRequestConfig, type AxiosResponse } from 'axios'
import { sample } from 'lodash-es'
import {
  avoidedContentTypes,
  commonHeaders,
  maxContentSize,
  maxRedirects,
  maxTimeout,
  userAgents,
} from '../constants/fetchers.ts'
import { UnsafeUrlError } from '../errors/UnsafeUrlError.ts'
import { createStreamingChecksum } from '../helpers/hashes.ts'
import { isOneOfContentTypes } from '../helpers/responses.ts'
import { isJson } from '../helpers/strings.ts'
import { sleep } from '../helpers/system.ts'
import { isSafePublicUrl } from '../helpers/urls.ts'

interface CustomAxiosRequestConfig extends AxiosRequestConfig {
  retriesCount?: number
}

// TODO:
// - Increase max header size to 64KB. This is possible in Unidici HTTPS Agent as an option
//   maxHeaderSize: 65536. See analogous thing in Axios.
// - Tell the server to give the uncompressed data. This is to mitigate issues where some servers
//   wrongly say they the response is gzipped where in reality it's not.
//   Solution: set 'Accept-Encoding': 'identity'.
//   Example page: ?
// - At some point, consider replacing Axios with native fetch (or Unidici) for more low-level
//   control and better performance and less dependencies on external packages. It might be
//   a challenge as a lot of stuff that Axios provides out of the box would need to be written
//   from scratch, but maybe it's worth it. Alternatively consider using Got or Ky packages.

// The CustomResponse class is necessary to simulate the native Response object behavior.
// When creating a Response object from AxiosObject manually, it is necessary to also store the
// URL of fetched page so that it can be referenced later. The native Response object has it out
// of the box when performing fetch(), but when creating it manually, there's no way to set it.
export class CustomResponse extends Response {
  public readonly url: string
  public readonly _body: string
  public readonly hash?: string

  constructor(body: string | null, init: ResponseInit & { url: string; hash?: string }) {
    super(undefined, init)
    this.url = init.url
    this._body = body || ''
    this.hash = init.hash
  }

  text(): Promise<string> {
    return Promise.resolve(this._body)
  }

  json(): Promise<ReturnType<typeof JSON.parse> | undefined> {
    return isJson(this._body) ? JSON.parse(this._body) : Promise.resolve(undefined)
  }
}

const axiosInstance = axios.create({
  timeout: maxTimeout,
  // Enables lenient HTTP parsing for non-standard server responses where Content-Length or
  // Transfer-Encoding headers might be malformed (common with legacy RSS feeds and
  // misconfigured servers).
  insecureHTTPParser: true,
  // Allows getting RSS feed from URLs with unverified certificate.
  // Enable connection pooling for better performance.
  httpsAgent: new https.Agent({
    rejectUnauthorized: false,
    keepAlive: true,
    maxSockets: 100,
  }),
  // Always return a response instead of throwing an exception. This allows for later use
  // of the erroneous response to detect the type of error in parsing middlewares.
  validateStatus: () => true,
  // Do not automatically transform JSON response to JSON object.
  transformResponse: [],
  // Need to use the stream response type to detect streaming services (eg. audio.)
  responseType: 'stream',
  // Default headers (will be merged with per-request headers)
  headers: commonHeaders,
  maxRedirects,
  beforeRedirect: (options, responseDetails) => {
    const redirectUrl = responseDetails.headers.location

    if (!isSafePublicUrl(redirectUrl)) {
      console.warn('[SECURITY] SSRF blocked: redirect to internal resource', {
        from: options.url,
        to: redirectUrl,
      })
      throw new UnsafeUrlError(redirectUrl)
    }
  },
})

const maxRetries = 3

// Try other user agent header as the server might require recognizable string.
axiosInstance.interceptors.response.use(
  async (response: AxiosResponse) => {
    const config = response.config as CustomAxiosRequestConfig
    const retriesCount = config.retriesCount || 0

    if (response.status === 403 && retriesCount < maxRetries) {
      const newRetriesCount = retriesCount + 1
      const newConfig: CustomAxiosRequestConfig = {
        ...config,
        retriesCount: newRetriesCount,
      }
      newConfig.headers = { ...config.headers, 'User-Agent': sample(userAgents) }

      // Exponential backoff with jitter to avoid thundering herd.
      await sleep(newRetriesCount * 1000 + Math.random() * 1000)

      return axiosInstance(newConfig)
    }

    return response
  },
  // Some servers have misconfigured IPv6 setup (AAAA DNS records exist but no actual IPv6
  // connectivity). When this happens, the first request attempts both IPv6 and IPv4, resulting
  // in ENETUNREACH or ETIMEDOUT errors. This retry logic forces IPv4-only (family: 4) on
  // subsequent attempts, which typically resolves the connection issues for such servers.
  async (error: AxiosError) => {
    if (!error.config) {
      return Promise.reject(error)
    }

    const config = error.config as CustomAxiosRequestConfig
    const retriesCount = config.retriesCount || 0

    if ((error.code === 'ENETUNREACH' || error.code === 'ETIMEDOUT') && retriesCount < maxRetries) {
      const newRetriesCount = retriesCount + 1
      const newConfig: CustomAxiosRequestConfig = {
        ...config,
        retriesCount: newRetriesCount,
        family: 4,
      }

      // Exponential backoff with jitter to avoid thundering herd.
      await sleep(newRetriesCount * 1000 + Math.random() * 1000)

      return axiosInstance(newConfig)
    }

    return Promise.reject(error)
  },
)

export const fetchUrl = async (
  url: string,
  config?: AxiosRequestConfig,
): Promise<CustomResponse> => {
  if (!isSafePublicUrl(url)) {
    throw new UnsafeUrlError(url)
  }

  const requestConfig: CustomAxiosRequestConfig = {
    ...config,
    retriesCount: 0,
    headers: {
      ...commonHeaders,
      ...config?.headers,
    },
  }

  const response = await axiosInstance(url, requestConfig)
  const contentType = String(response.headers['content-type'])

  // If it's not text, abort right away and destroy the stream so we don't keep reading.
  if (isOneOfContentTypes(contentType, avoidedContentTypes)) {
    response.data.destroy()
    throw new Error(`Unwanted content-type: ${contentType}`)
  }

  const hash = createStreamingChecksum()
  const chunks: Array<Buffer> = []

  let downloadedBytes = 0

  for await (const chunk of response.data) {
    downloadedBytes += chunk.length

    // Check the size as data arrives and abort the download immediately if it exceeds the max
    // allowed size, preventing memory issues from extremely large responses or streams (eg.
    // video or audio stream).
    if (downloadedBytes > maxContentSize) {
      response.data.destroy()
      throw new Error(`Content length exceeded the limit: ${maxContentSize}`)
    }

    hash.update(chunk)
    chunks.push(chunk)
  }

  const body = response.status === 304 ? null : Buffer.concat(chunks).toString('utf-8')

  return new CustomResponse(body, {
    url: response.request?.res?.responseUrl || url,
    status: response.status,
    statusText: response.statusText,
    headers: new Headers(response.headers as Record<string, string>),
    hash: hash.digest(),
  })
}
