import { parseFeed } from '../actions/parseFeed'
import { anyFeedContentTypes } from '../constants/scrapers'
import { isOneOfContentTypes } from '../helpers/scrapers'
import { BaseFeedFinder } from './BaseFeedFinder'

export class DirectFeedFinder extends BaseFeedFinder {
    async canHandle(response: Response) {
        return isOneOfContentTypes(response, anyFeedContentTypes)
    }

    async findFeeds(response: Response) {
        const { channel } = await parseFeed(response)

        return [{ title: channel.title, url: channel.url }]
    }

    async hasServiceChanged() {
        return false
    }
}
