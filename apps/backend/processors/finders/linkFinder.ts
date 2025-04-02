import { chooseFeedUrl } from '../../actions/chooseFeedUrl'
import { fetchFeed } from '../../actions/fetchFeed'
import type { FindFeedsProcessor } from '../../actions/findFeeds'
import { feedUris } from '../../constants/finders'
import { resolveRelativeUrl } from '../../helpers/urls'
import type { FoundFeeds } from '../../types/schemas'

export const linkFinder: FindFeedsProcessor = async (context, next) => {
  if (!context.response || context.result) {
    return await next()
  }

  // TODO: Add option to also look for URIs in the news.* and blog.* domains.

  const feeds: FoundFeeds['feeds'] = []

  for (const feedUri of feedUris) {
    try {
      const requestUrl = resolveRelativeUrl(feedUri, context.url)

      if (feeds.some(({ url }) => url === requestUrl)) {
        continue
      }

      const feedData = await fetchFeed({ url: requestUrl, channel: context.channel })
      const chosenUrl = await chooseFeedUrl(feedData)

      if (feeds.some(({ url }) => url === chosenUrl)) {
        continue
      }

      feeds.push({ title: feedData.channel.title, url: chosenUrl })
    } catch {}
  }

  if (feeds.length) {
    context.result = {
      meta: {
        etag: context.response.headers.get('etag'),
        hash: context.response.hash,
      },
      feeds,
    }
  }

  await next()
}
