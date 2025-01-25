import { fetchExternalUrl } from '../actions/fetchExternalUrl'
import { parseFeed } from '../actions/parseFeed'
import { htmlContentTypes } from '../constants/parsers'
import { extractValueByRegex, isOneOfContentTypes } from '../helpers/responses'

export const youTubeFinder = async (response: Response, url: string) => {
    // TODO: What about youtu.be domain? I should be supported as well.
    if (!url.includes('youtube.com') || !isOneOfContentTypes(response, htmlContentTypes)) {
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
    const feedResponse = await fetchExternalUrl(feedUrl)
    const { channel } = await parseFeed(feedResponse, feedUrl)

    return [{ url: feedUrl, title: channel.title }]
}
