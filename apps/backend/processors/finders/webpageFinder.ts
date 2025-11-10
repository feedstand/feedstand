import { load } from 'cheerio'
import { chooseFeedUrl } from '../../actions/chooseFeedUrl.ts'
import { fetchFeed } from '../../actions/fetchFeed.ts'
import type { FindFeedsProcessor } from '../../actions/findFeeds.ts'
import { feedLinkSelectors, feedUris, ignoredFeedUris } from '../../constants/finders.ts'
import { resolveRelativeUrl } from '../../helpers/urls.ts'
import type { FoundFeeds } from '../../types/schemas.ts'

// Combine all selectors into single query for better performance.
const anchorSelector = feedUris.map((uri) => `a[href$="${uri}"]`)
const megaSelector = [...feedLinkSelectors, ...anchorSelector].join()

export const extractFeedUrls = (html: string, baseUrl: string): Array<string> => {
  const $ = load(html)
  const allElements = $(megaSelector)
  const seenUrl = new Set<string>()
  const uniqueUrls: Array<string> = []

  for (const element of allElements) {
    const href = $(element).attr('href')

    if (!href || ignoredFeedUris.some((ignored) => href.includes(ignored))) {
      continue
    }

    const resolvedUrl = resolveRelativeUrl(href, baseUrl)

    if (!seenUrl.has(resolvedUrl)) {
      seenUrl.add(resolvedUrl)
      uniqueUrls.push(resolvedUrl)
    }
  }

  return uniqueUrls
}

export const webpageFinder: FindFeedsProcessor = async (context, next) => {
  if (!context.response) {
    return await next()
  }

  const html = await context.response.text()
  const feedUrls = extractFeedUrls(html, context.response.url)
  const feeds: FoundFeeds['feeds'] = []

  const feedResults = await Promise.all(
    feedUrls.map(async (feedUrl) => {
      try {
        const feedData = await fetchFeed({ url: feedUrl, channel: context.channel })
        const chosenUrl = await chooseFeedUrl(feedData)
        return { title: feedData.channel.title, url: chosenUrl }
      } catch {}
    }),
  )

  for (const result of feedResults) {
    if (!result) continue
    if (feeds.some(({ url }) => url === result.url)) continue
    feeds.push(result)
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
