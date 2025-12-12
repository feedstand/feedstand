import { type DiscoverExtractFn, type DiscoverFetchFn, discoverFeeds } from 'feedscout'
import { chooseFeedUrl } from '../../actions/chooseFeedUrl.ts'
import { fetchFeed } from '../../actions/fetchFeed.ts'
import { fetchUrl } from '../../actions/fetchUrl.ts'
import type { FindFeedsProcessor } from '../../actions/findFeeds.ts'
import type { FoundFeeds } from '../../types/schemas.ts'

type FeedscoutResult = {
  format: 'rss' | 'atom' | 'json' | 'rdf'
  title?: string
  chosenUrl: string
}

const fetchFn: DiscoverFetchFn = async (url, options) => {
  const response = await fetchUrl(url, {
    headers: options?.headers,
  })

  return {
    headers: response.headers,
    body: await response.text(),
    url: response.url,
    status: response.status,
    statusText: response.statusText,
  }
}

const extractFn: DiscoverExtractFn<FeedscoutResult> = async ({ url }) => {
  const feedData = await fetchFeed({ url })
  const chosenUrl = await chooseFeedUrl(feedData)

  return {
    url: chosenUrl,
    isValid: true,
    format: feedData.meta.type,
    title: feedData.channel.title ?? undefined,
    chosenUrl,
  }
}

export const feedscoutFinder: FindFeedsProcessor = async (context, next) => {
  if (!context.response) {
    return await next()
  }

  const content = await context.response.text()
  const results = await discoverFeeds(
    {
      url: context.response.url,
      content,
      headers: context.response.headers,
    },
    {
      methods: ['platform', 'html', 'headers', 'guess'],
      fetchFn,
      extractFn,
      concurrency: 3,
      includeInvalid: false,
    },
  )

  if (results.length === 0) {
    return await next()
  }

  // Deduplicate by chosenUrl.
  const existingUrls = new Set<string>()
  const feeds: FoundFeeds['feeds'] = []

  for (const result of results) {
    if (!result.isValid) {
      continue
    }

    const chosenUrl = result.chosenUrl
    if (!existingUrls.has(chosenUrl)) {
      feeds.push({
        url: chosenUrl,
        title: result.title,
      })
      existingUrls.add(chosenUrl)
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
