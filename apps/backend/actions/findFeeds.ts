import { HTTPException } from 'hono/http-exception'
import { FeedInfo } from '../types/schemas'
import { FeedFinder } from '../types/system'

export type FindFeeds = (
    response: Response,
    url: string,
    finders: Array<FeedFinder>,
) => Promise<Array<FeedInfo>>

export const findFeeds: FindFeeds = async (response, url, finders) => {
    for (const finder of finders) {
        const feeds = await finder(response.clone(), url)

        if (feeds !== undefined) {
            return feeds
        }
    }

    throw new HTTPException(422)
}
