import { fetchFeed } from '../../actions/fetchFeed'
import { FindFeedsProcessor } from '../../actions/findFeeds'
import { htmlContentTypes } from '../../constants/fetchers'
import { youTubeDomains } from '../../constants/finders'
import { extractValueByRegex, isOneOfContentTypes } from '../../helpers/responses'

export const youTubeFinder: FindFeedsProcessor = async (context, next) => {
    if (!context.response?.ok) {
        return await next()
    }

    const isYouTubeDomain = youTubeDomains.some((domain) => context.response?.url.includes(domain))
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

    const url = `https://www.youtube.com/feeds/videos.xml?channel_id=${channelId}`
    const feedData = await fetchFeed({ url, channel: context?.channel })

    context.result = {
        etag: context.response.headers.get('etag'),
        feeds: [{ url, title: feedData.channel.title }],
    }

    await next()
}
