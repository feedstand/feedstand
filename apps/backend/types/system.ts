import { FeedData, FeedInfo } from './schemas'

export type FeedFetcherOptions = {
    init?: RequestInit
    lastError?: unknown
}

export type FeedFetcher = (url: string, options: FeedFetcherOptions) => Promise<Response>

export type FeedFinder = (response: Response, url: string) => Promise<Array<FeedInfo> | undefined>

export type FeedParser = (response: Response, url: string) => Promise<FeedData | undefined>

export type ValueParser<R, V = unknown> = (value: V) => R | undefined
