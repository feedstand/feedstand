import { FetchFeedMiddleware } from '../actions/fetchFeed'
import { fetchUrl } from '../actions/fetchUrl'

export const downloadFeed: FetchFeedMiddleware = async (context, next) => {
    if (context.response) {
        return await next()
    }

    try {
        context.response = await fetchUrl(context.url)
    } catch (error) {
        context.error = error
    }

    await next()
}
