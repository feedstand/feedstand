import { FetchFeedFetcher } from '../actions/fetchFeed'
import { fetchUrl } from '../actions/fetchUrl'

export const axiosFetch: FetchFeedFetcher = async (context, next) => {
    if (context.response?.ok) {
        return await next()
    }

    try {
        context.response = await fetchUrl(context.url)
    } catch (error) {
        context.error = error
    }

    await next()
}
