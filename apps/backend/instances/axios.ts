import axios from 'axios'
import axiosRetry from 'axios-retry'

export const instance = axios.create({
    // TODO: Enable caching of requests based on headers in the response.
    timeout: 30 * 1000,
    // Enables lenient HTTP parsing for non-standard server responses where Content-Length or
    // Transfer-Encoding headers might be malformed (common with legacy RSS feeds and
    // misconfigured servers).
    insecureHTTPParser: true,
})

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
