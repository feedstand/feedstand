import { FetchFeedFetcher } from '../actions/fetchFeed'
import { maxTimeout } from '../constants/fetchers'

export const nativeFetch: FetchFeedFetcher = async (context, next) => {
    if (context.response?.ok) {
        return await next()
    }

    // TODO: Enable caching of requests based on headers in the response.
    context.response = await fetch(context.url, {
        signal: AbortSignal.timeout(maxTimeout),
    })

    await next()
}
