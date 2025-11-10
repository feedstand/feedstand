import { isAbsoluteUrl, isSafePublicUrl, isSimilarUrl } from '../helpers/urls.ts'
import type { FeedData } from '../types/schemas.ts'
import { type FetchUrlResponse, fetchUrl } from './fetchUrl.ts'

export const chooseFeedUrl = async (feedData: FeedData) => {
  console.debug('[chooseFeedUrl]', {
    'feedData.channel.selfUrl': feedData.channel.selfUrl,
    'feedData.meta.responseUrl': feedData.meta.responseUrl,
  })

  // Case #1: selfUrl is empty.
  if (!feedData.channel.selfUrl) {
    console.debug('Case #1: selfUrl is empty.')
    return feedData.meta.responseUrl
  }

  // Case #2: selfUrl is equal to responseUrl.
  if (feedData.channel.selfUrl === feedData.meta.responseUrl) {
    console.debug('Case #2: selfUrl is equal to responseUrl.')
    return feedData.meta.responseUrl
  }

  // Case #3: selfUrl is a relative URL.
  if (!isAbsoluteUrl(feedData.channel.selfUrl)) {
    console.debug('Case #3: selfUrl is a relative URL.')
    return feedData.meta.responseUrl
  }

  // Case #4: selfUrl targets private/internal resources (SSRF protection).
  if (!isSafePublicUrl(feedData.channel.selfUrl)) {
    console.warn('[SECURITY] Case #4: selfUrl targets private/internal resource:', {
      selfUrl: feedData.channel.selfUrl,
      responseUrl: feedData.meta.responseUrl,
    })
    return feedData.meta.responseUrl
  }

  // TODO: Consider supporting other cases:
  // 1. For non-HTTPS, check if HTTPS version of the link also works and has the same hash.
  // 2. Check if URL contains multiple forward slashes and collapse them into one, then check
  //    whether it's the same hash.
  // 3. If there are 2 feeds with a different response hash but the same channel information and
  //    items, use the self URL.

  let response: FetchUrlResponse

  try {
    response = await fetchUrl(feedData.channel.selfUrl)
  } catch {
    return feedData.meta.responseUrl
  }

  // Case #5: selfUrl is an invalid URL or returns an error.
  if (!response.ok) {
    console.debug('Case #5: selfUrl is an invalid URL or returns an error.')
    return feedData.meta.responseUrl
  }

  // Case #6: selfUrl redirects to responseUrl.
  if (response.url === feedData.meta.responseUrl) {
    console.debug('Case #6: selfUrl redirects to responseUrl.')
    return feedData.meta.responseUrl
  }

  // Case #7: selfUrl is not equal to responseUrl but similar (after normalizing).
  if (isSimilarUrl(feedData.channel.selfUrl, feedData.meta.responseUrl)) {
    console.debug('Case #7: selfUrl is not equal to responseUrl but similar (after normalizing).')
    return feedData.channel.selfUrl
  }

  // Case #8: selfUrl is not equal to responseUrl but the response is the same.
  if (feedData.meta.hash && response.hash && feedData.meta.hash === response.hash) {
    console.debug('Case #8: selfUrl is not equal to responseUrl but the response is the same.')
    return feedData.channel.selfUrl
  }

  // Case #9: As a fallback, return the responseUrl.
  console.debug('Case #9: As a fallback, return the responseUrl.')
  return feedData.meta.responseUrl
}
