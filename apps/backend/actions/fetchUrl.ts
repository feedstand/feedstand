import https from 'node:https'
import axios, { type AxiosError, type AxiosRequestConfig, type AxiosResponse } from 'axios'
import { sample } from 'lodash-es'
import {
  avoidedContentTypes,
  commonHeaders,
  maxContentSize,
  maxTimeout,
  userAgents,
} from '../constants/fetchers.ts'
import { createStreamingChecksum } from '../helpers/hashes.ts'
import { isOneOfContentTypes } from '../helpers/responses.ts'
import { isJson } from '../helpers/strings.ts'
import { sleep } from '../helpers/system.ts'

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

export const fetchUrl = async (
  url: string,
  config?: AxiosRequestConfig,
): Promise<CustomResponse> => {
  let retriesCount = 0
  const maxRetries = 3

  const instance = axios.create({
    timeout: maxTimeout,
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
    // Customize the headers by always setting default ones and adding option to set custom ones.
    headers: {
      ...commonHeaders,
      // TODO: The below needs to be re-validated as sometimes having */* causes the server to
      // reject the request.
      // // Turn off the default preference for application/json in the Accept header.
      // 'Accept': '*/*',
      // 'Accept-Encoding': 'identity',
      ...config?.headers,
    },
    // Append any custom configuration at the end.
    ...config,
  })

  // Try other user agent header as the server might require recognizable string.
  const userAgentInterceptor = async (response: AxiosResponse) => {
    if (response.status === 403 && retriesCount < maxRetries) {
      retriesCount++
      response.config.headers['User-Agent'] = sample(userAgents)

      // Exponential backoff with jitter to avoid thundering herd.
      await sleep(retriesCount * 1000 + Math.random() * 1000)

      return instance(response.config)
    }

    return response
  }

  // Some servers have misconfigured IPv6 setup (AAAA DNS records exist but no actual IPv6
  // connectivity). When this happens, the first request attempts both IPv6 and IPv4, resulting
  // in ENETUNREACH or ETIMEDOUT errors. This retry logic forces IPv4-only (family: 4) on
  // subsequent attempts, which typically resolves the connection issues for such servers.
  const ipFamilyInterceptor = async (error: AxiosError) => {
    if (
      error.config &&
      (error.code === 'ENETUNREACH' || error.code === 'ETIMEDOUT') &&
      retriesCount < maxRetries
    ) {
      retriesCount++
      error.config.family = 4

      // Exponential backoff with jitter to avoid thundering herd.
      await sleep(retriesCount * 1000 + Math.random() * 1000)

      return instance(error.config)
    }

    return Promise.reject(error)
  }

  instance.interceptors.response.use(userAgentInterceptor, ipFamilyInterceptor)

  const response = await instance(url)
  const contentType = String(response.headers['content-type'])

  // If it's not text, abort right away and destroy the stream so we don't keep reading.
  if (isOneOfContentTypes(contentType, avoidedContentTypes)) {
    response.data.destroy()
    throw new Error(`Unwanted content-type: ${contentType}`)
  }

  let body = ''
  let downloadedBytes = 0
  const hash = createStreamingChecksum()

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
    body += chunk
  }

  return new CustomResponse(response.status === 304 ? null : body, {
    url: response.request?.res?.responseUrl || url,
    status: response.status,
    statusText: response.statusText,
    headers: new Headers(response.headers as Record<string, string>),
    hash: hash.digest(),
  })
}
