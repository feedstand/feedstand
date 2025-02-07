import { fetchFeed } from '../actions/fetchFeed'
import { FindFeedsMiddleware } from '../actions/findFeeds'
import { htmlContentTypes } from '../constants/fetchers'
import { youTubeDomains } from '../constants/finders'
import { extractValueByRegex, isOneOfContentTypes } from '../helpers/responses'

export const youTubeFinder: FindFeedsMiddleware = async (context, next) => {
    if (!context.response?.ok) {
        return await next()
    }

    const isYouTubeDomain = youTubeDomains.some((domain) => context.response.url.includes(domain))
    const isHtmlPage = isOneOfContentTypes(context.response, htmlContentTypes)

    if (!isYouTubeDomain || !isHtmlPage) {
        return await next()
    }

    const channelId = await extractValueByRegex(
        context.response.clone(),
        /"(external)?channelId":\s*"([^"]+)"/i,
        { matchIndex: 2, chunkOverlap: 100 },
    )

    if (!channelId) {
        return await next()
    }

    const feedUrl = `https://www.youtube.com/feeds/videos.xml?channel_id=${channelId}`
    const feed = await fetchFeed(feedUrl, { channel: context?.channel })

    context.feedInfos = [{ url: feedUrl, title: feed.channel.title }]

    await next()
}
