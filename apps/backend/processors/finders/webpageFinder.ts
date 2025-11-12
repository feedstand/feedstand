import pLimit from 'p-limit'
import { chooseFeedUrl } from '../../actions/chooseFeedUrl.ts'
import { fetchFeed } from '../../actions/fetchFeed.ts'
import type { FindFeedsProcessor } from '../../actions/findFeeds.ts'
import { anyFeedContentTypes } from '../../constants/fetchers.ts'
import { feedFetchConcurrency, feedUris, ignoredFeedUris } from '../../constants/finders.ts'
import { prepareUrl } from '../../helpers/urls.ts'
import type { FoundFeeds } from '../../types/schemas.ts'

// Build dynamic regex pattern for feed content type.
const escapedContentTypes = anyFeedContentTypes.map((type) =>
  type.replace(/[.*+?^${}()|[\]\\]/g, '\\$&').replace(/\//g, '\\/'),
)
const contentTypePattern = escapedContentTypes.join('|')

// Compile static regex patterns once at module load.
const linkPattern = /<link\s+([^>]*?)>/gi
const anchorPattern = /<a\s+([^>]*?)>/gi
const relAlternatePattern = /\brel\s*=\s*["']?alternate["']?/i
const typePattern = new RegExp(`\\btype\\s*=\\s*["']?(${contentTypePattern})["']?`, 'i')
const hrefPattern = /\bhref\s*=\s*["']?([^"'\s>]+)["']?/i

/**
 * Remove script tags, style tags, and HTML comments without regex backtracking.
 * Uses linear-time string scanning instead of regex to avoid catastrophic backtracking on large files.
 */
const cleanHtml = (html: string): string => {
  let result = ''
  let i = 0

  while (i < html.length) {
    // Check for HTML comments: <!-- ... -->
    if (html.substring(i, i + 4) === '<!--') {
      const end = html.indexOf('-->', i + 4)
      if (end === -1) break // Unclosed comment, stop processing
      i = end + 3
      continue
    }

    // Check for script tags: <script...>...</script>
    if (html.substring(i, i + 7).toLowerCase() === '<script') {
      // Find the end of opening tag
      const openTagEnd = html.indexOf('>', i)
      if (openTagEnd === -1) break

      // Find closing </script>
      const closeTagStart = html.toLowerCase().indexOf('</script>', openTagEnd)
      if (closeTagStart === -1) break

      i = closeTagStart + 9 // Skip past </script>
      continue
    }

    // Check for style tags: <style...>...</style>
    if (html.substring(i, i + 6).toLowerCase() === '<style') {
      // Find the end of opening tag
      const openTagEnd = html.indexOf('>', i)
      if (openTagEnd === -1) break

      // Find closing </style>
      const closeTagStart = html.toLowerCase().indexOf('</style>', openTagEnd)
      if (closeTagStart === -1) break

      i = closeTagStart + 8 // Skip past </style>
      continue
    }

    result += html[i]
    i++
  }

  return result
}

export const extractFeedUrls = (html: string, baseUrl: string): Set<string> => {
  const feedUrls = new Set<string>()
  const processedHtml = cleanHtml(html)

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

  // Match link elements with rel="alternate" and feed content type.
  for (const linkMatch of processedHtml.matchAll(linkPattern)) {
    const attrs = linkMatch[1]

    if (!relAlternatePattern.test(attrs) || !typePattern.test(attrs)) {
      continue
    }

    const href = hrefPattern.exec(attrs)?.[1]

    addUrlIfValid(href)
  }

  // Match anchor elements with href ending in feed URIs.
  for (const anchorMatch of processedHtml.matchAll(anchorPattern)) {
    const attrs = anchorMatch[1]
    const href = hrefPattern.exec(attrs)?.[1]

    if (href && feedUris.some((uri) => href.endsWith(uri))) {
      addUrlIfValid(href)
    }
  }

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
