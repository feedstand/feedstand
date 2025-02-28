import axios, { AxiosRequestConfig } from 'axios'
import axiosRetry from 'axios-retry'
import https from 'node:https'
import { avoidedContentTypes, maxContentSize, maxTimeout } from '../constants/fetchers'
import { isOneOfContentTypes } from '../helpers/responses'
import { isJson } from '../helpers/strings'

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

const instance = axios.create()

// The CustomResponse class is necessary to simulate the native Response object behavior.
// When creating a Response object from AxiosObject manually, it is necessary to also store the
// URL of fetched page so that it can be referenced later. The native Response object has it out
// of the box when performing fetch(), but when creating it manually, there's no way to set it.
export class CustomResponse extends Response {
  public readonly url: string
  public readonly _body: string

  constructor(body: string | null, init: ResponseInit & { url: string }) {
    super(undefined, init)
    this.url = init.url
    this._body = body || ''
  }

  text(): Promise<string> {
    return Promise.resolve(this._body)
  }

  json<T>(): Promise<T> {
    return isJson(this._body) ? JSON.parse(this._body) : undefined
  }
}

axiosRetry(instance, {
  retries: 2,
  // Some servers have misconfigured IPv6 setup (AAAA DNS records exist but no actual IPv6
  // connectivity). When this happens, the first request attempts both IPv6 and IPv4, resulting
  // in ENETUNREACH or ETIMEDOUT errors. This retry logic forces IPv4-only (family: 4) on
  // subsequent attempts, which typically resolves the connection issues for such servers.
  retryCondition: (error) => {
    if (error.config && (error.code === 'ENETUNREACH' || error.code === 'ETIMEDOUT')) {
      error.config.family = 4

      return true
    }

    return false
  },
})

export const fetchUrl = async (url: string, config?: AxiosRequestConfig): Promise<Response> => {
  const response = await axios(url, {
    // TODO: Enable caching of requests based on headers in the response.
    timeout: maxTimeout,
    // Limit the size of the response.
    maxContentLength: maxContentSize,
    // Enables lenient HTTP parsing for non-standard server responses where Content-Length or
    // Transfer-Encoding headers might be malformed (common with legacy RSS feeds and
    // misconfigured servers).
    insecureHTTPParser: true,
    // Allows getting RSS feed from URLs with unverified certificate.
    httpsAgent: new https.Agent({ rejectUnauthorized: false }),
    // Always return a response instead of throwing an exception. This allows for later use
    // of the erroneous response to detect the type of error in parsing middlewares.
    validateStatus: () => true,
    // Do not automatically transform JSON response to JSON object.
    transformResponse: [],
    // Need to use the stream response type to detect streaming services (eg. audio.)
    responseType: 'stream',
    // Append any custom configuration at the end.
    ...config,
  })

  const contentType = String(response.headers['content-type'])

  // If it's not text, abort right away and destroy the stream so we don't keep reading.
  if (isOneOfContentTypes(contentType, avoidedContentTypes)) {
    response.data.destroy(new Error('Non-text or streaming content detected'))
    throw new Error(`Unwanted content-type: ${contentType}`)
  }

  let body = ''
  let downloadedBytes = 0

  for await (const chunk of response.data) {
    downloadedBytes += chunk.length

    if (downloadedBytes > maxContentSize) {
      response.data.destroy(new Error('Content length exceeded the limit'))
      throw new Error('File is too large')
    }

    body += chunk
  }

  return new CustomResponse(response.status === 304 ? null : body, {
    url: response.request?.res?.responseUrl || url,
    status: response.status,
    statusText: response.statusText,
    headers: new Headers(response.headers as Record<string, string>),
  })
}
