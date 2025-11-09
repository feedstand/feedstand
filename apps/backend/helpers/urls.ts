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

export const resolveAbsoluteUrl = (url: string): string => {
  return url.startsWith('//') ? `https:${url}` : url
}

export const resolveRelativeUrl = (url: string, base: string): string => {
  if (isAbsoluteUrl(url)) {
    return url
  }

  try {
    return new URL(url, base).href
  } catch {
    return url
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

export const isSimilarUrl = (url1: string, url2: string): boolean => {
  const normalizeOptions: Options = {
    stripProtocol: true,
    stripWWW: true,
    removeTrailingSlash: true,
    stripHash: true,
    sortQueryParameters: true,
  }

  try {
    const normalizedUrl1 = normalizeUrl(url1, normalizeOptions)
    const normalizedUrl2 = normalizeUrl(url2, normalizeOptions)
    return normalizedUrl1 === normalizedUrl2
  } catch {
    return false
  }
}
