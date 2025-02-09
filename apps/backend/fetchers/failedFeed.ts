import { FetchFeedMiddleware } from '../actions/fetchFeed'

export const failedFeed: FetchFeedMiddleware = async (context, next) => {
    if (!context.error) {
        return await next()
    }

    if (context.error instanceof Error && context.error.cause) {
        context.error = context.error.cause
    }

    await next()
}
