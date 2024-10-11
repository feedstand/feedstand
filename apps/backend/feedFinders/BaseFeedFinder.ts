import { FeedInfo } from '../types/schemas'

export abstract class BaseFeedFinder {
    abstract canHandle(response: Response, url: string): Promise<boolean>
    abstract findFeeds(response: Response, url: string): Promise<Array<FeedInfo> | undefined>

    async hasServiceChanged() {
        return false
    }
}
