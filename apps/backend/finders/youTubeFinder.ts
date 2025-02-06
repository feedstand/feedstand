import { fetchFeed } from '../actions/fetchFeed'
import { htmlContentTypes } from '../constants/parsers'
import { extractValueByRegex, isOneOfContentTypes } from '../helpers/responses'
import { FeedFinder } from '../types/system'

export const youTubeDomains = ['youtu.be', 'youtube.com']

export const youTubeFinder: FeedFinder = async (response, options) => {
    if (
        !youTubeDomains.some((domain) => response.url.includes(domain)) ||
        !isOneOfContentTypes(response, htmlContentTypes)
    ) {
        return
    }

    const channelId = await extractValueByRegex(response, /"browseId":"([^"]+)"/, {
        matchIndex: 1,
        chunkOverlap: 100,
    })

    if (!channelId) {
        return
    }

    const feedUrl = `https://www.youtube.com/feeds/videos.xml?channel_id=${channelId}`
    const feed = await fetchFeed(feedUrl, { channel: options?.channel })

    return [{ url: feedUrl, title: feed.channel.title }]
}
