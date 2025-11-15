import { discoverFeedUris } from 'feedscout'
import { chooseFeedUrl } from '../../actions/chooseFeedUrl.ts'
import { fetchFeed } from '../../actions/fetchFeed.ts'
import type { FindFeedsProcessor } from '../../actions/findFeeds.ts'
import { anyFeedContentTypes } from '../../constants/fetchers.ts'
import { feedUris, ignoredFeedUris } from '../../constants/finders.ts'
import { prepareUrl } from '../../helpers/urls.ts'
import type { FoundFeeds } from '../../types/schemas.ts'

const anchorLabels = ['rss', 'feed', 'atom', 'subscribe', 'syndicate', 'json feed']

export const webpageHtmlFinder: FindFeedsProcessor = async (context, next) => {
  if (!context.response) {
    return await next()
  }

  const html = await context.response.text()
  const rawFeedUrls = discoverFeedUris(html, {
    linkMimeTypes: anyFeedContentTypes,
    anchorUris: feedUris,
    anchorIgnoredUris: ignoredFeedUris,
    anchorLabels,
  })
  const feeds: FoundFeeds['feeds'] = []
  const existingUrls = new Set<string>()

  // Resolve and validate raw URLs.
  const feedUrls = rawFeedUrls
    .map((url) => {
      return prepareUrl(url, {
        base: context.response?.url,
        validate: true,
      })
    })
    .filter((url): url is string => {
      return url != null
    })

  for (const feedUrl of feedUrls) {
    try {
      const feedData = await fetchFeed({ url: feedUrl, channel: context.channel })
      const chosenUrl = await chooseFeedUrl(feedData)

      if (!existingUrls.has(chosenUrl)) {
        feeds.push({
          title: feedData.channel.title,
          url: chosenUrl,
        })
        existingUrls.add(chosenUrl)
      }
    } catch {}
  }

  if (feeds.length) {
    context.result = {
      meta: {
        etag: context.response.headers.get('etag'),
        lastModified: context.response.headers.get('last-modified'),
        hash: context.response.hash,
      },
      feeds,
    }
  }

  await next()
}
