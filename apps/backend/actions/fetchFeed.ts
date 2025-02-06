import { axiosFetch } from '../fetchers/axiosFetch'
import { failedFeed } from '../fetchers/failedFeed'
import { guardedFeed } from '../fetchers/guardedFeed'
import { invalidFeed } from '../fetchers/invalidFeed'
import { jsonFeed } from '../fetchers/jsonFeed'
import { nativeFetchUncompressed } from '../fetchers/nativeFetchUncompressed'
import { soundCloudFeed } from '../fetchers/soundCloudFeed'
import { xmlFeed } from '../fetchers/xmlFeed'
import { Channel, FeedData } from '../types/schemas'

export type FetchFeedContext = {
    url: string
    channel?: Channel
    error?: unknown
    response?: Response
    feed?: FeedData
}

export type FetchFeed = (
    url: string,
    initialContext?: Omit<FetchFeedContext, 'url' | 'feed'>,
) => Promise<FeedData>

export type FetchFeedNextFunction = () => Promise<void>

export type FetchFeedFetcher = (
    context: FetchFeedContext,
    next: FetchFeedNextFunction,
) => Promise<void>

export const middlewares: Array<FetchFeedFetcher> = [
    nativeFetchUncompressed,
    axiosFetch,
    soundCloudFeed,
    jsonFeed,
    xmlFeed,
    guardedFeed,
    invalidFeed,
    failedFeed,
]

export const fetchFeed: FetchFeed = async (url, initialContext): Promise<FeedData> => {
    const context: FetchFeedContext = { ...initialContext, url }

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
