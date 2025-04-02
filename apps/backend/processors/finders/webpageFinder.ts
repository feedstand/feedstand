import { load } from 'cheerio'
import { chooseFeedUrl } from '../../actions/chooseFeedUrl'
import { fetchFeed } from '../../actions/fetchFeed'
import type { FindFeedsProcessor } from '../../actions/findFeeds'
import { feedLinkSelectors, feedUris, ignoredFeedUris } from '../../constants/finders'
import { resolveRelativeUrl } from '../../helpers/urls'
import type { FoundFeeds } from '../../types/schemas'

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

  for (const feedUrl of feedUrls) {
    try {
      const feedData = await fetchFeed({ url: feedUrl, channel: context.channel })
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
