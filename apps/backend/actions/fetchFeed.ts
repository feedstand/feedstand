import { downloadFeed } from '../fetchers/downloadFeed'
import { failedFeed } from '../fetchers/failedFeed'
import { guardedFeed } from '../fetchers/guardedFeed'
import { invalidFeed } from '../fetchers/invalidFeed'
import { jsonFeed } from '../fetchers/jsonFeed'
import { redirectFeed } from '../fetchers/redirectFeed'
import { soundCloudFeed } from '../fetchers/soundCloudFeed'
import { xmlFeed } from '../fetchers/xmlFeed'
import { Channel, FeedData } from '../types/schemas'

export type FetchFeedContext = {
    url: string
    response?: Response
    channel?: Channel
    error?: unknown
    feed?: FeedData
}

export type FetchFeed = (context: FetchFeedContext) => Promise<FeedData>

export type FetchFeedNextFunction = () => Promise<void>

export type FetchFeedFetcher = (
    context: FetchFeedContext,
    next: FetchFeedNextFunction,
) => Promise<void>

export const middlewares: Array<FetchFeedFetcher> = [
    downloadFeed,
    soundCloudFeed,
    jsonFeed,
    xmlFeed,
    redirectFeed,
    guardedFeed,
    invalidFeed,
    failedFeed,
]

export const fetchFeed: FetchFeed = async (context) => {
    let index = 0

    const next: FetchFeedNextFunction = async () => {
        const middleware = middlewares[index++]

        if (!middleware) {
            return
        }

        await middleware(context, next)
    }

    await next()

    if (context.feed) {
        return context.feed
    }

    if (context.error) {
        throw context.error
    }

    throw new Error(`Unprocessable response, HTTP code: ${context.response?.status || 'Unknown'}`)
}
