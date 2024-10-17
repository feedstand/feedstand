import { parseFeed } from '../actions/parseFeed'
import { anyFeedContentTypes } from '../constants/parsers'
import { isOneOfContentTypes } from '../helpers/finders'
import { BaseFinder } from './BaseFinder'

export class DirectFinder extends BaseFinder {
    async canHandle(response: Response) {
        return isOneOfContentTypes(response, anyFeedContentTypes)
    }

    async findFeeds(response: Response, url: string) {
        const { channel } = await parseFeed(response, url)

        return [{ title: channel.title, url: channel.url }]
    }
}
