import { chooseFeedUrl } from '../../actions/chooseFeedUrl.ts'
import { fetchFeed } from '../../actions/fetchFeed.ts'
import type { FindFeedsProcessor } from '../../actions/findFeeds.ts'

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
    const feedUrl = await chooseFeedUrl(feedData)

    context.result = {
      meta: {
        etag: feedData.meta.etag,
        lastModified: feedData.meta.lastModified,
        hash: feedData.meta.hash,
      },
      feeds: [
        {
          title: feedData.channel.title,
          url: feedUrl,
        },
      ],
    }
  } catch (error) {
    context.error = error
  }

  await next()
}
