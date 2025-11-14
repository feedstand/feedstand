import pLimit from 'p-limit'
import { chooseFeedUrl } from '../../actions/chooseFeedUrl.ts'
import { fetchFeed } from '../../actions/fetchFeed.ts'
import type { FindFeedsProcessor } from '../../actions/findFeeds.ts'
import { anyFeedContentTypes } from '../../constants/fetchers.ts'
import { feedFetchConcurrency, ignoredFeedUris } from '../../constants/finders.ts'
import { isOneOfContentTypes } from '../../helpers/responses.ts'
import { prepareUrl } from '../../helpers/urls.ts'
import type { FoundFeeds } from '../../types/schemas.ts'

// RFC 8288: Web Linking - HTTP Link header field for feed discovery.
// https://www.rfc-editor.org/rfc/rfc8288

export const extractFeedUrlsFromHeaders = (headers: Headers, baseUrl: string): Set<string> => {
  const feedUrls = new Set<string>()
  const linkHeaders = headers.get('link')

  if (!linkHeaders) {
    return feedUrls
  }

  // Split by comma, but not commas inside angle brackets or quotes.
  const links = linkHeaders.split(/,(?=\s*<)/)

  for (const link of links) {
    // Parse: <URL>; rel="alternate"; type="application/rss+xml"
    // URLs in Link headers should not contain < or > (must be percent-encoded).
    const urlMatch = link.match(/<([^<>]+)>/)
    const relMatch = link.match(/rel=["']?([^"';,]+)["']?/i)
    const typeMatch = link.match(/type=["']?([^"';,]+)["']?/i)

    if (!urlMatch) {
      continue
    }

    const url = urlMatch[1]
    const rel = relMatch?.[1]?.toLowerCase()
    const type = typeMatch?.[1]

    // Check if this is an alternate feed link.
    if (rel === 'alternate' && type && isOneOfContentTypes(type, anyFeedContentTypes)) {
      if (ignoredFeedUris.some((ignored) => url.includes(ignored))) {
        continue
      }

      const preparedUrl = prepareUrl(url, {
        base: baseUrl,
        validate: true,
      })

      if (preparedUrl) {
        feedUrls.add(preparedUrl)
      }
    }
  }

  return feedUrls
}

export const webpageHeadersFinder: FindFeedsProcessor = async (context, next) => {
  if (!context.response) {
    return await next()
  }

  const feedUrls = extractFeedUrlsFromHeaders(context.response.headers, context.response.url)
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
