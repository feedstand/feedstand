import { Parser } from 'htmlparser2'
import pLimit from 'p-limit'
import { chooseFeedUrl } from '../../actions/chooseFeedUrl.ts'
import { fetchFeed } from '../../actions/fetchFeed.ts'
import type { FindFeedsProcessor } from '../../actions/findFeeds.ts'
import { anyFeedContentTypes } from '../../constants/fetchers.ts'
import { feedFetchConcurrency, feedUris, ignoredFeedUris } from '../../constants/finders.ts'
import { isOneOfContentTypes } from '../../helpers/responses.ts'
import { prepareUrl } from '../../helpers/urls.ts'
import type { FoundFeeds } from '../../types/schemas.ts'

export const extractFeedUrls = (html: string, baseUrl: string): Set<string> => {
  const feedUrls = new Set<string>()

  // Helper to add URL if valid and not seen.
  const addUrlIfValid = (href: string | undefined): void => {
    if (!href || ignoredFeedUris.some((ignored) => href.includes(ignored))) return

    const preparedUrl = prepareUrl(href, {
      base: baseUrl,
      validate: true,
    })

    if (preparedUrl) {
      feedUrls.add(preparedUrl)
    }
  }

  const parser = new Parser({
    onopentag(name, attribs) {
      if (name === 'link' && attribs.href) {
        const rel = attribs.rel?.toLowerCase()

        if (rel === 'alternate' && isOneOfContentTypes(attribs.type, anyFeedContentTypes)) {
          addUrlIfValid(attribs.href)
        }
      }

      // Extract anchor elements with href ending in feed URIs.
      if (name === 'a' && attribs.href) {
        if (feedUris.some((uri) => attribs.href.endsWith(uri))) {
          addUrlIfValid(attribs.href)
        }
      }
    },
  })

  parser.write(html)
  parser.end()

  return feedUrls
}

export const webpageFinder: FindFeedsProcessor = async (context, next) => {
  if (!context.response) {
    return await next()
  }

  const html = await context.response.text()
  const feedUrls = extractFeedUrls(html, context.response.url)
  const feeds: FoundFeeds['feeds'] = []
  const limit = pLimit(feedFetchConcurrency)

  const feedResults = await Promise.all(
    [...feedUrls].map((feedUrl) =>
      limit(async () => {
        try {
          const feedData = await fetchFeed({ url: feedUrl, channel: context.channel })
          const chosenUrl = await chooseFeedUrl(feedData)

          return {
            title: feedData.channel.title,
            url: chosenUrl,
          }
        } catch {}
      }),
    ),
  )

  for (const result of feedResults) {
    if (!result || feeds.some(({ url }) => url === result.url)) {
      continue
    }

    feeds.push(result)
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
