import { HTTPException } from 'hono/http-exception'
import { FeedInfo } from '../types/schemas'

export const findFeeds = async (
    response: Response,
    url: string,
    finders: Array<(response: Response, url: string) => Promise<Array<FeedInfo> | undefined>>,
): Promise<Array<FeedInfo>> => {
    for (const finder of finders) {
        const feeds = await finder(response.clone(), url)

        if (feeds !== undefined) {
            return feeds
        }
    }

    throw new HTTPException(422)
}
