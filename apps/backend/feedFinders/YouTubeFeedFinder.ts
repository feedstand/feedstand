import { fetchExternalUrl } from '../actions/fetchExternalUrl'
import { parseFeed } from '../actions/parseFeed'
import { htmlContentTypes } from '../constants/scrapers'
import { extractValueByRegex, isOneOfContentTypes } from '../helpers/scrapers'
import { BaseFeedFinder } from './BaseFeedFinder'

export class YouTubeFeedFinder extends BaseFeedFinder {
    async canHandle(response: Response, url: string) {
        return url.includes('youtube.com') && isOneOfContentTypes(response, htmlContentTypes)
    }

    async findFeeds(response: Response) {
        const channelId = await extractValueByRegex(response, /"browseId":"([^"]+)"/, {
            matchIndex: 1,
            chunkOverlap: 100,
        })

        if (!channelId) {
            return
        }

        const feedUrl = `https://www.youtube.com/feeds/videos.xml?channel_id=${channelId}`
        const feedResponse = await fetchExternalUrl(feedUrl)
        const { channel } = await parseFeed(feedResponse)

        return [{ url: feedUrl, title: channel.title }]
    }

    async hasServiceChanged() {
        return false // TODO: Implement the function.
    }
}
