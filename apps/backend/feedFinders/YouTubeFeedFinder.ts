import { htmlContentTypes } from '../constants/scrapers'
import { isOneOfContentTypes } from '../helpers/scrapers'
import { BaseFeedFinder } from './BaseFeedFinder'

export class YouTubeFeedFinder extends BaseFeedFinder {
    async canHandle(response: Response, url: string) {
        return url.includes('youtube.com') && isOneOfContentTypes(response, htmlContentTypes)
    }

    async findFeeds() {
        return undefined // TODO: Implement the function.
    }

    async hasServiceChanged() {
        return false // TODO: Implement the function.
    }
}
