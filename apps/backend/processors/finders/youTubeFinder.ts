import { fetchFeed } from '../../actions/fetchFeed.js'
import type { FindFeedsProcessor } from '../../actions/findFeeds.js'
import { htmlContentTypes } from '../../constants/fetchers.js'
import { youTubeDomains } from '../../constants/finders.js'
import { extractValueByRegex, isOneOfContentTypes } from '../../helpers/responses.js'

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
    meta: {
      etag: context.response.headers.get('etag'),
      hash: context.response.hash,
    },
    feeds: [
      {
        title: feedData.channel.title,
        url: feedData.channel.selfUrl || feedData.meta.responseUrl,
      },
    ],
  }

  await next()
}
