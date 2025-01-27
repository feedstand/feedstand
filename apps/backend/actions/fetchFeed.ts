import { axiosFetch } from '../fetchers/axiosFetch'
import { cloudflareFetch } from '../fetchers/cloudflareFetch'
import { nativeFetch } from '../fetchers/nativeFetch'
import { FeedFetcher } from '../types/system'

export type FetchFeed = (
    url: string,
    init?: RequestInit,
    fetchers?: Array<FeedFetcher>,
) => Promise<Response>

export const feedFetchers: Array<FeedFetcher> = [nativeFetch, axiosFetch, cloudflareFetch]

export const fetchFeed: FetchFeed = async (url, init, fetchers = feedFetchers) => {
    let lastError: unknown = undefined

    for (const fetcher of fetchers) {
        try {
            return await fetcher(url, { init, lastError })
        } catch (error) {
            lastError = error
        }
    }

    throw lastError
}
