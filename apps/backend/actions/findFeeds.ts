import { HTTPException } from 'hono/http-exception'
import { BaseFeedFinder } from '../feedFinders/BaseFeedFinder'
import { DirectFeedFinder } from '../feedFinders/DirectFeedFinder'
import { WebpageFeedFinder } from '../feedFinders/WebpageFeedFinder'
import { YouTubeFeedFinder } from '../feedFinders/YouTubeFeedFinder'
import { FeedInfo } from '../types/schemas'

type FindFeeds = (response: Response, externalUrl: string) => Promise<Array<FeedInfo>>

export const findFeeds: FindFeeds = async (response, externalUrl) => {
    const finders: Array<BaseFeedFinder> = [
        new YouTubeFeedFinder(),
        new DirectFeedFinder(),
        new WebpageFeedFinder(),
    ]

    for (const finder of finders) {
        if (await finder.canHandle(response, externalUrl)) {
            const feeds = await finder.findFeeds(response, externalUrl)

            if (feeds !== undefined) {
                return feeds
            }

            // TODO: Implement notifications about changed service. For every finder, it should be
            // checked whether `hasServiceChanged` function returns true.
        }
    }

    throw new HTTPException(422)
}
