import { FeedFetcher } from '../types/system'

export const nativeFetch: FeedFetcher = async (url, { init }) => {
    if (init) {
        init.signal ||= AbortSignal.timeout(30 * 1000)
    }

    // TODO: Enable caching of requests based on headers in the response.
    const response = await fetch(url, init)

    if (!response.ok) {
        throw Error(`HTTP status code ${response.status}`)
    }

    return response
}
