import { FeedFetcher } from '../types/system'

export const cloudflareFetch: FeedFetcher = async (_url, options) => {
    // TODO: Look for a solution to the Cloudflare blocking automatic feed fetching.
    // Example of a feed causing problems: https://www.viovet.co.uk/blog.rss. Related links:
    // - https://openrss.org/issue/144
    // - https://developers.cloudflare.com/bots/reference/verified-bots-policy/
    throw options?.lastError
}
