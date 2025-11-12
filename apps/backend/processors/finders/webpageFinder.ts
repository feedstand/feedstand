import { chooseFeedUrl } from '../../actions/chooseFeedUrl.ts'
import { fetchFeed } from '../../actions/fetchFeed.ts'
import type { FindFeedsProcessor } from '../../actions/findFeeds.ts'
import { anyFeedContentTypes } from '../../constants/fetchers.ts'
import { feedUris, ignoredFeedUris } from '../../constants/finders.ts'
import { prepareUrl } from '../../helpers/urls.ts'
import type { FoundFeeds } from '../../types/schemas.ts'

// Build dynamic regex pattern for feed content type.
const escapedContentTypes = anyFeedContentTypes.map((type) =>
  type.replace(/[.*+?^${}()|[\]\\]/g, '\\$&').replace(/\//g, '\\/'),
)
const contentTypePattern = escapedContentTypes.join('|')

// Compile static regex patterns once at module load.
const cleanupPattern = /<!--[\s\S]*?-->|<script[\s\S]*?<\/script>|<style[\s\S]*?<\/style>/gi
const linkPattern = /<link\s+([^>]*?)>/gi
const anchorPattern = /<a\s+([^>]*?)>/gi
const relAlternatePattern = /\brel\s*=\s*["']?alternate["']?/i
const typePattern = new RegExp(`\\btype\\s*=\\s*["']?(${contentTypePattern})["']?`, 'i')
const hrefPattern = /\bhref\s*=\s*["']?([^"'\s>]+)["']?/i

export const extractFeedUrls = (html: string, baseUrl: string): Array<string> => {
  const seenUrls = new Set<string>()
  const uniqueUrls: Array<string> = []

  const cleanHtml = html.replace(cleanupPattern, '')

  // Helper to add URL if valid and not seen.
  const addUrlIfValid = (href: string | undefined): void => {
    if (!href || ignoredFeedUris.some((ignored) => href.includes(ignored))) return

    const preparedUrl = prepareUrl(href, {
      base: baseUrl,
      validate: true,
    })

    if (preparedUrl && !seenUrls.has(preparedUrl)) {
      seenUrls.add(preparedUrl)
      uniqueUrls.push(preparedUrl)
    }
  }

  // Match link elements with rel="alternate" and feed content type.
  for (const linkMatch of cleanHtml.matchAll(linkPattern)) {
    const attrs = linkMatch[1]

    if (!relAlternatePattern.test(attrs)) continue
    if (!typePattern.test(attrs)) continue

    const href = hrefPattern.exec(attrs)?.[1]

    addUrlIfValid(href)
  }

  // Match anchor elements with href ending in feed URIs.
  for (const anchorMatch of cleanHtml.matchAll(anchorPattern)) {
    const attrs = anchorMatch[1]
    const href = hrefPattern.exec(attrs)?.[1]

    if (href && feedUris.some((uri) => href.endsWith(uri))) {
      addUrlIfValid(href)
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
        lastModified: context.response.headers.get('last-modified'),
        hash: context.response.hash,
      },
      feeds,
    }
  }

  await next()
}
