import { jsonFeed } from '../parsers/feeds/jsonFeed'
import { notFoundFeed } from '../parsers/feeds/notFoundFeed'
import { redirectFeed } from '../parsers/feeds/redirectFeed'
import { soundCloudFeed } from '../parsers/feeds/soundCloudFeed'
import { xmlFeed } from '../parsers/feeds/xmlFeed'
import { Channel, FeedData } from '../types/schemas'
import { FeedParser } from '../types/system'

export type ParseFeed = (
    response: Response,
    options?: {
        channel?: Channel
        parsers?: Array<FeedParser>
    },
) => Promise<FeedData>

export const feedParsers: Array<FeedParser> = [
    notFoundFeed,
    redirectFeed,
    soundCloudFeed,
    jsonFeed,
    xmlFeed,
]

// TODO: To optimize the function use cases, add options parameter that will give control whether
// to return channel/items or not. This could be useful in fetchAndDiscoverFeeds action where we
// only need the Channel details and do not care about Items.
export const parseFeed: ParseFeed = async (response, options) => {
    const parsers = options?.parsers || feedParsers

    for (const parser of parsers) {
        const feed = await parser(response.clone(), {
            channel: options?.channel,
        })

        if (feed !== undefined) {
            return feed
        }
    }

    throw new Error('No matching parser', { cause: response })
}
