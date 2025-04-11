import normalizeUrl from 'normalize-url'
import { isAbsoluteUrl } from '../helpers/urls.js'
import type { FeedData } from '../types/schemas.js'
import { type CustomResponse, fetchUrl } from './fetchUrl.js'

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

  // TODO: Consider supporting other cases:
  // 1. For non-HTTPS, check if HTTPS version of the link also works and has the same hash.
  // 2. Check if URL contains multiple forward slashes and collapse them into one, then check
  //    whether it's the same hash.
  // 3. If there are 2 feeds with a different response hash but the same channel information and
  //    items, use the self URL.

  let response: CustomResponse

  try {
    response = await fetchUrl(feedData.channel.selfUrl)
  } catch {
    return feedData.meta.responseUrl
  }

  const normalizeOptions = { stripProtocol: true, stripWWW: true, removeTrailingSlash: true }
  const normalizedSelfUrl = normalizeUrl(feedData.channel.selfUrl, normalizeOptions)
  const normalizedResponseUrl = normalizeUrl(feedData.meta.responseUrl, normalizeOptions)

  // Case #4: selfUrl is not equal to responseUrl but similar (after normalizing).
  if (normalizedSelfUrl === normalizedResponseUrl) {
    console.debug('Case #4: selfUrl is not equal to responseUrl but similar (after normalizing).')
    return feedData.channel.selfUrl
  }

  // Case #5: selfUrl is an invalid URL.
  if (!response.ok) {
    console.debug('Case #5: selfUrl is an invalid URL.')
    return feedData.meta.responseUrl
  }

  // Case #6: selfUrl is not equal to responseUrl but the response is the same.
  if (feedData.meta.hash === response.hash) {
    console.debug('Case #6: selfUrl is not equal to responseUrl but the response is the same.')
    return feedData.channel.selfUrl
  }

  // Case #7: As a fallback, return the responseUrl.
  console.debug('Case #7: As a fallback, return the responseUrl.')
  return feedData.meta.responseUrl
}
