import { axiosFetch } from '../fetchers/axiosFetch'
import { cloudflareFetch } from '../fetchers/cloudflareFetch'
import { nativeFetch } from '../fetchers/nativeFetch'
import { Channel } from '../types/schemas'
import { FeedFetcher } from '../types/system'

export type FetchFeed = (
    url: string,
    options?: {
        channel?: Channel
        init?: RequestInit
        fetchers?: Array<FeedFetcher>
    },
) => Promise<Response>

export const feedFetchers: Array<FeedFetcher> = [nativeFetch, axiosFetch, cloudflareFetch]

export const fetchFeed: FetchFeed = async (url, options) => {
    const fetchers = options?.fetchers || feedFetchers

    let lastError: unknown = undefined

    for (const fetcher of fetchers) {
        try {
            return await fetcher(url, {
                channel: options?.channel,
                init: options?.init,
                lastError,
            })
        } catch (error) {
            lastError = error
        }
    }

    throw lastError
}
