import axios, { AxiosRequestConfig } from 'axios'
import axiosRetry from 'axios-retry'
import https from 'node:https'
import { FetchFeedFetcher } from '../actions/fetchFeed'
import { maxTimeout } from '../constants/fetchers'

const instance = axios.create()

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

export const axiosFetch: FetchFeedFetcher = async (context, next) => {
    if (context.response?.ok) {
        return await next()
    }

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

    try {
        const response = await axios(context.url, config)

        context.response = new Response(response.data, {
            status: response.status,
            statusText: response.statusText,
            headers: new Headers(response.headers as Record<string, string>),
        })
    } catch (error) {
        context.error = error
    }

    await next()
}
