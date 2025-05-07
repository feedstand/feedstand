import { fetchFeed } from '../../actions/fetchFeed.ts'
import type { FindFeedsProcessor } from '../../actions/findFeeds.ts'
import { htmlContentTypes } from '../../constants/fetchers.ts'
import { youTubeDomains } from '../../constants/finders.ts'
import { extractValueByRegex, isOneOfContentTypes } from '../../helpers/responses.ts'

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
