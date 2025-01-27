import { maxTimeout } from '../constants/fetchers'
import { FeedFetcher } from '../types/system'

export const nativeFetch: FeedFetcher = async (url, options) => {
    if (options?.init) {
        options.init.signal ||= AbortSignal.timeout(maxTimeout)
    }

    // TODO: Enable caching of requests based on headers in the response.
    const response = await fetch(url, options?.init)

    if (!response.ok) {
        throw Error(`HTTP status code ${response.status}`)
    }

    return response
}
