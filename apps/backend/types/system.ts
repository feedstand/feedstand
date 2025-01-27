import { Channel, FeedData, FeedInfo } from './schemas'

export type FeedFinder = (
    response: Response,
    options?: {
        channel?: Channel
    },
) => Promise<Array<FeedInfo> | undefined>

export type FeedFetcher = (
    url: string,
    options?: {
        channel?: Channel
        init?: RequestInit
        lastError?: unknown
    },
) => Promise<Response>

export type FeedParser = (
    response: Response,
    options?: {
        channel?: Channel
    },
) => Promise<FeedData | undefined>

export type ValueParser<R, V = unknown> = (value: V) => R | undefined
