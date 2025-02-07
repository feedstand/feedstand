import axios, { AxiosRequestConfig } from 'axios'
import axiosRetry from 'axios-retry'
import https from 'node:https'
import { maxTimeout } from '../constants/fetchers'

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
class CustomResponse extends Response {
    public readonly url: string

    constructor(body: BodyInit | null, init: ResponseInit & { url: string }) {
        super(body, init)
        this.url = init.url
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

export const fetchUrl = async (url: string): Promise<Response> => {
    const config: AxiosRequestConfig = {
        // TODO: Enable caching of requests based on headers in the response.
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
    }

    const response = await axios(url, config)

    return new CustomResponse(response.data, {
        url: response.request?.res?.responseUrl || url,
        status: response.status,
        statusText: response.statusText,
        headers: new Headers(response.headers as Record<string, string>),
    })
}
