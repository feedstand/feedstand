import { FetchFeedFetcher } from '../actions/fetchFeed'
import { fetchUrl } from '../actions/fetchUrl'

export const preflightFeed: FetchFeedFetcher = async (context, next) => {
    if (context.response?.ok || !context.channel?.lastScanEtag || !context.channel?.lastScannedAt) {
        return await next()
    }

    try {
        const response = await fetchUrl(context.url, {
            method: 'head',
            headers: {
                // TODO: Consider adding support for Cache-Control and Age headers to detect if
                // the content is still fresh.
                'If-None-Match': context.channel?.lastScanEtag,
                'If-Modified-Since': context.channel?.lastScannedAt
                    ? new Date(context.channel?.lastScannedAt)?.toUTCString()
                    : undefined,
            },
        })

        if (response.status === 304) {
            context.response = response
        }
    } catch (error) {
        context.error = error
    }

    await next()
}
