import normalizeUrl, { type Options } from 'normalize-url'
import { isSSRFSafeURL } from 'ssrfcheck'

export const isAbsoluteUrl = (url: string): boolean => {
  try {
    const parsed = new URL(url)
    return parsed.protocol === 'https:' || parsed.protocol === 'http:'
  } catch {
    return false
  }
}

export const resolveNonStandardFeedUrl = (url: string) => {
  // Examples:
  // - feed://example.com/rss.xml → https://example.com/rss.xml
  // - feed:https://example.com/rss.xml → https://example.com/rss.xml
  // - rss://example.com/feed.xml → https://example.com/feed.xml
  // - pcast://example.com/podcast.xml → https://example.com/podcast.xml
  // - itpc://example.com/podcast.xml → https://example.com/podcast.xml
  const feedSchemes = ['feed:', 'rss:', 'pcast:', 'itpc:']

  for (const scheme of feedSchemes) {
    if (!url.startsWith(scheme)) {
      continue
    }

    // Case 1: Wrapping protocol (e.g., feed:https://example.com).
    if (url.startsWith(`${scheme}http://`) || url.startsWith(`${scheme}https://`)) {
      return url.slice(scheme.length)
    }

    // Case 2: Replacing protocol (e.g., feed://example.com).
    if (url.startsWith(`${scheme}//`)) {
      return `https:${url.slice(scheme.length)}`
    }
  }

  return url
}

export const resolveAbsoluteUrl = (url: string): string => {
  if (url.startsWith('//')) {
    return `https:${url}`
  }

  return resolveNonStandardFeedUrl(url)
}

export const resolveRelativeUrl = (url: string, base: string): string => {
  const normalized = resolveAbsoluteUrl(url)

  if (isAbsoluteUrl(normalized)) {
    return normalized
  }

  try {
    return new URL(normalized, base).href
  } catch {
    return normalized
  }
}

export const isSafePublicUrl = (url: string): boolean => {
  // TODO: Add DNS validation to prevent DNS rebinding attacks. ssrfcheck only validates
  // the URL string, not the actual DNS resolution. An attacker could control DNS to
  // resolve a public domain (passes check) to a private IP (169.254.169.254, etc).
  // Solution: Perform DNS lookup and validate resolved IP addresses before fetchUrl().
  return isSSRFSafeURL(url, {
    quiet: true,
    noIP: false,
    allowedProtocols: ['http', 'https'],
    allowUsername: true,
  })
}

const similarUrlOptions: Options = {
  stripProtocol: true,
  stripWWW: true,
  removeTrailingSlash: true,
  stripHash: true,
  sortQueryParameters: true,
} as const

export const isSimilarUrl = (url1: string, url2: string): boolean => {
  try {
    const normalizedUrl1 = normalizeUrl(url1, similarUrlOptions)
    const normalizedUrl2 = normalizeUrl(url2, similarUrlOptions)
    return normalizedUrl1 === normalizedUrl2
  } catch {
    return false
  }
}
