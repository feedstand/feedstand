import { load } from 'cheerio'
import { chooseFeedUrl } from '../../actions/chooseFeedUrl.ts'
import { fetchFeed } from '../../actions/fetchFeed.ts'
import type { FindFeedsProcessor } from '../../actions/findFeeds.ts'
import { feedLinkSelectors, feedUris, ignoredFeedUris } from '../../constants/finders.ts'
import { resolveRelativeUrl } from '../../helpers/urls.ts'
import type { FoundFeeds } from '../../types/schemas.ts'

export const extractFeedUrls = (html: string, baseUrl: string): Array<string> => {
  const $ = load(html)
  const feedUrls: Array<string> = []

  const linkElements = $(feedLinkSelectors.join())

  for (const linkElement of linkElements) {
    const linkHref = $(linkElement).attr('href') || ''
    feedUrls.push(linkHref)
  }

  for (const feedUri of feedUris) {
    const anchorHref = $(`a[href$="${feedUri}"]`).attr('href') || ''
    feedUrls.push(anchorHref)
  }

  const uniqueAndResolvedFeedUrls = [...new Set(feedUrls)]
    .filter((url) => url && !ignoredFeedUris.includes(url))
    .map((url) => resolveRelativeUrl(url, baseUrl))

  return uniqueAndResolvedFeedUrls
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
