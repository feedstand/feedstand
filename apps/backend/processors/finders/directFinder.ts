import { fetchFeed } from '../../actions/fetchFeed.js'
import type { FindFeedsProcessor } from '../../actions/findFeeds.js'

export const directFinder: FindFeedsProcessor = async (context, next) => {
  if (!context.response?.ok) {
    return await next()
  }

  try {
    const feedData = await fetchFeed({
      url: context.response.url,
      response: context.response,
      channel: context.channel,
    })

    context.result = {
      meta: {
        etag: feedData.meta.etag,
        hash: feedData.meta.hash,
      },
      feeds: [
        {
          title: feedData.channel.title,
          url: feedData.channel.selfUrl || feedData.meta.responseUrl,
        },
      ],
    }
  } catch (error) {
    context.error = error
  }

  await next()
}
