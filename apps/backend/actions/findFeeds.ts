import { HTTPException } from 'hono/http-exception'
import { directFinder } from '../finders/directFinder'
import { webpageFinder } from '../finders/webpageFinder'
import { youTubeFinder } from '../finders/youTubeFinder'
import { Channel, FeedInfo } from '../types/schemas'
import { FeedFinder } from '../types/system'

export type FindFeeds = (
    response: Response,
    options?: {
        channel?: Channel
        finders?: Array<FeedFinder>
    },
) => Promise<Array<FeedInfo>>

const feedFinders = [youTubeFinder, directFinder, webpageFinder]

export const findFeeds: FindFeeds = async (response, options) => {
    const finders = options?.finders || feedFinders

    for (const finder of finders) {
        const feeds = await finder(response.clone())

        if (feeds !== undefined) {
            return feeds
        }
    }

    throw new HTTPException(422)
}
