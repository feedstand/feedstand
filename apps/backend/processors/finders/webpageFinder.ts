import { load } from 'cheerio'
import { fetchFeed } from '../../actions/fetchFeed'
import type { FindFeedsProcessor } from '../../actions/findFeeds'
import { feedLinkSelectors, feedUris } from '../../constants/finders'
import { resolveRelativeUrl } from '../../helpers/urls'
import type { FoundFeeds } from '../../types/schemas'

export const extractFeedUrls = (html: string, baseUrl: string): Array<string> => {
  const $ = load(html)
  const feedUrls: Array<string> = []

  const linkElements = $(feedLinkSelectors.join())

  for (const linkElement of linkElements) {
    const linkHref = $(linkElement).attr('href')

    if (!linkHref) {
      continue
    }

    feedUrls.push(resolveRelativeUrl(linkHref, baseUrl))
  }

  for (const feedUri of feedUris) {
    const linkHref = $(`a[href$="${feedUri}"]`).attr('href')

    if (!linkHref) {
      continue
    }

    feedUrls.push(resolveRelativeUrl(linkHref, baseUrl))
  }

  return [...new Set(feedUrls)]
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

      feeds.push({
        title: feedData.channel.title,
        url: feedData.channel.selfUrl || feedData.meta.responseUrl,
      })
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
