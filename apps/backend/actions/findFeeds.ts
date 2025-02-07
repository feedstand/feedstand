import { directFinder } from '../finders/directFinder'
import { webpageFinder } from '../finders/webpageFinder'
import { youTubeFinder } from '../finders/youTubeFinder'
import { Channel, FeedInfo } from '../types/schemas'

export type FindFeedsContext = {
    response: Response
    channel?: Channel
    error?: unknown
    feedInfos?: Array<FeedInfo>
}

export type FindFeeds = (
    initialContext: Omit<FindFeedsContext, 'feeds'>,
) => Promise<Array<FeedInfo>>

export type FindFeedsNext = () => Promise<void>

export type FindFeedsMiddleware = (context: FindFeedsContext, next: FindFeedsNext) => Promise<void>

export const middlewares: Array<FindFeedsMiddleware> = [youTubeFinder, directFinder, webpageFinder]

export const findFeeds: FindFeeds = async (initialContext) => {
    const context: FindFeedsContext = { ...initialContext }

    let index = 0

    const next: FindFeedsNext = async () => {
        const middleware = middlewares[index++]

        if (!middleware) {
            return
        }

        await middleware(context, next)
    }

    await next()

    if (context.feedInfos) {
        return context.feedInfos
    }

    if (context.error) {
        throw context.error
    }

    throw new Error(`Unprocessable response, HTTP code: ${context.response?.status || 'Unknown'}`)
}
