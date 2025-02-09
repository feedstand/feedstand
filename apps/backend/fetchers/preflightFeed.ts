import { FetchFeedMiddleware } from '../actions/fetchFeed'
import { isUrlFresh } from '../actions/isUrlFresh'

export const preflightFeed: FetchFeedMiddleware = async (context, next) => {
    if (context.response?.ok || !context.channel?.lastScanEtag || !context.channel?.lastScannedAt) {
        return await next()
    }

    try {
        const { isFresh, response } = await isUrlFresh(context.url, {
            etag: context.channel?.lastScanEtag,
            date: context.channel?.lastScannedAt
                ? new Date(context.channel?.lastScannedAt)
                : undefined,
        })

        if (isFresh) {
            context.response = response
        }
    } catch (error) {
        context.error = error
    }

    await next()
}
