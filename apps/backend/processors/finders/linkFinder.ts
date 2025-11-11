import { chooseFeedUrl } from '../../actions/chooseFeedUrl.ts'
import { fetchFeed } from '../../actions/fetchFeed.ts'
import type { FindFeedsProcessor } from '../../actions/findFeeds.ts'
import { feedUris } from '../../constants/finders.ts'
import { resolveRelativeUrl } from '../../helpers/urls.ts'
import type { FoundFeeds } from '../../types/schemas.ts'

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

      const feedData = await fetchFeed({
        url: requestUrl,
        channel: context.channel,
        options: {
          // Perform an one-time fetch to quickly check whether the URL exists.
          retry: { limit: 0, errorCodes: [], statusCodes: [] },
        },
      })

      const chosenUrl = await chooseFeedUrl(feedData)

      if (feeds.some(({ url }) => url === chosenUrl)) {
        continue
      }

      feeds.push({ title: feedData.channel.title, url: chosenUrl })
    } catch {
      // TODO: Stop if server returned 522 (origin timeout) - server is unreachable.
      // if ((error as any)?.cause === 522) {
      //   break
      // }
      // // Ignore other feed failures, try next URL
    }
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
