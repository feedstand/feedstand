import type { FindFeedsProcessor } from '../../actions/findFeeds.ts'

export const wordpressFinder: FindFeedsProcessor = async (context, next) => {
  if (!context.response || context.result) {
    return await next()
  }

  // TODO: Detect WordPress signatures in HTML/headers and return standard WordPress feed URLs
  // immediately without fetching them first. This would save bandwidth and time for WordPress
  // sites by using known feed URL patterns:
  // - Check for WordPress meta generator tag: <meta name="generator" content="WordPress x.x.x">
  // - Check for X-Powered-By or other WordPress-specific headers.
  // This optimization would be especially useful since WordPress powers ~40% of websites.

  await next()
}
