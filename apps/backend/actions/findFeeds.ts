import { HTTPException } from 'hono/http-exception'
import { BaseFinder } from '../finders/BaseFinder'
import { DirectFinder } from '../finders/DirectFinder'
import { WebpageFinder } from '../finders/WebpageFinder'
import { YouTubeFinder } from '../finders/YouTubeFinder'
import { FeedInfo } from '../types/schemas'

export const findFeeds = async (response: Response, url: string): Promise<Array<FeedInfo>> => {
    const finders: Array<BaseFinder> = [
        new YouTubeFinder(),
        new DirectFinder(),
        new WebpageFinder(),
    ]

    for (const finder of finders) {
        if (await finder.canHandle(response.clone(), url)) {
            const feeds = await finder.findFeeds(response.clone(), url)

            if (feeds !== undefined) {
                return feeds
            }

            // TODO: Implement notifications about changed service. For every finder, it should be
            // checked whether `hasServiceChanged` function returns true.
        }
    }

    throw new HTTPException(422)
}
