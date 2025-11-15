import { chooseFeedUrl } from '../../actions/chooseFeedUrl.ts'
import { fetchFeed } from '../../actions/fetchFeed.ts'
import type { FindFeedsProcessor } from '../../actions/findFeeds.ts'
import { feedUris, skippedDomains } from '../../constants/finders.ts'
import { isOneOfDomains, prepareUrl } from '../../helpers/urls.ts'
import type { FoundFeeds } from '../../types/schemas.ts'

export const linkFinder: FindFeedsProcessor = async (context, next) => {
  if (!context.response || context.result) {
    return await next()
  }

  // Skip domains that are known to not have feeds or cause issues
  if (isOneOfDomains(context.url, skippedDomains)) {
    console.debug('[linkFinder] Skipping domain:', { url: context.url })
    return await next()
  }

  // TODO: Add option to also look for URIs in the news.* and blog.* domains.
  // TODO: Consider stopping at 1st found feed to reduce bandwidth and CPU usage.

  const feeds: FoundFeeds['feeds'] = []
  const existingUrls = new Set<string>()

  for (const feedUri of feedUris) {
    try {
      const requestUrl = prepareUrl(feedUri, {
        base: context.url,
        validate: true,
      })

      if (!requestUrl || existingUrls.has(requestUrl)) {
        continue
      }

      // TODO: Implement preflight check before fetching full content to avoid downloading large
      // non-feed files (e.g. 6.7MB HTML pages). Should perform a HEAD request to check:
      // - Content-Type header (must be feed-related: application/rss+xml, application/atom+xml, etc.)
      // - HTTP status code (should be 200)
      // - Content-Length (skip if too large, e.g. >1MB)
      // This would prevent wasting bandwidth and CPU on obviously non-feed URLs.

      const feedData = await fetchFeed({
        url: requestUrl,
        channel: context.channel,
        // Perform an one-time fetch to quickly check whether the URL exists.
        options: { retry: { limit: 0 }, maxContentSize: 500 * 1024 },
      })

      const chosenUrl = await chooseFeedUrl(feedData)

      if (existingUrls.has(chosenUrl)) {
        continue
      }

      console.debug('[linkFinder] Feed found:', {
        requestUrl,
        chosenUrl,
        title: feedData.channel.title,
        feedUri,
      })

      feeds.push({ title: feedData.channel.title, url: chosenUrl })
      existingUrls.add(chosenUrl)
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
        lastModified: context.response.headers.get('last-modified'),
        hash: context.response.hash,
      },
      feeds,
    }
  }

  await next()
}
