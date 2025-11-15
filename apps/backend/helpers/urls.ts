import { decodeHTML } from 'entities'
import * as ipaddr from 'ipaddr.js'
import normalizeUrl, { type Options } from 'normalize-url'
import { isSSRFSafeURL } from 'ssrfcheck'

export const isAbsoluteUrl = (url: string): boolean => {
  // Protocol-relative URLs are treated as absolute (they have hostname, just need protocol)
  if (url.indexOf('//') === 0) {
    const resolved = resolveProtocolRelativeUrl(url)
    return resolved !== url // If resolved, it was a valid protocol-relative URL
  }

  try {
    const parsed = new URL(url)
    return parsed.protocol === 'https:' || parsed.protocol === 'http:'
  } catch {
    return false
  }
}

// Convert known feed-related protocols to HTTPS. Examples:
// - feed://example.com/rss.xml → https://example.com/rss.xml
// - feed:https://example.com/rss.xml → https://example.com/rss.xml
// - rss://example.com/feed.xml → https://example.com/feed.xml
// - pcast://example.com/podcast.xml → https://example.com/podcast.xml
// - itpc://example.com/podcast.xml → https://example.com/podcast.xml
export const resolveNonStandardFeedUrl = (url: string) => {
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

export const isSafePublicUrl = (url: string): boolean => {
  // UNSAFE: Disable SSRF protection for localhost. Only use in isolated test environments.
  if (
    process.env.UNSAFE_DISABLE_SSRF_CHECK === 'true' &&
    (url.startsWith('http://localhost:') || url.startsWith('https://localhost:'))
  ) {
    return true
  }

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

const ipv4Pattern = /^\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}$/
const ipv6Pattern = /^[0-9a-f:]+$/i

/**
 * Converts protocol-relative URLs to absolute URLs. Examples:
 * - //example.com/feed → https://example.com/feed
 * - //cdn.example.com/script.js → https://cdn.example.com/script.js
 * - //Users/file.xml → //Users/file.xml (unchanged, not a URL)
 * - //localhost/api → https://localhost/api
 * - //192.168.1.1/api → https://192.168.1.1/api
 */
export const resolveProtocolRelativeUrl = (
  url: string,
  protocol: 'http' | 'https' = 'https',
): string => {
  if (!url.startsWith('//') || url.startsWith('///')) {
    return url
  }

  try {
    const parsed = new URL(`${protocol}:${url}`)
    const hostname = parsed.hostname

    // Valid web hostnames must have at least one of:
    if (
      hostname.indexOf('.') !== -1 ||
      hostname === 'localhost' ||
      ipv4Pattern.test(hostname) ||
      ipv6Pattern.test(hostname)
    ) {
      return parsed.href
    }

    return url
  } catch {
    return url
  }
}

/**
 * Validates a URL for security and structural issues.
 * Checks for SSRF safety, excessive length, and malformed URLs.
 */
export const validateUrl = (url: string): boolean => {
  // Check URL length (RFC 2616 recommends 2048, but we use 2048 as max).
  if (url.length > 2048) {
    return false
  }

  // Check for SSRF safety.
  if (!isSafePublicUrl(url)) {
    return false
  }

  try {
    const parsed = new URL(url)

    // Check for excessive query parameters (potential DoS or malformed URL).
    const paramCount = Array.from(parsed.searchParams.keys()).length
    if (paramCount > 50) {
      return false
    }

    // Check for suspicious patterns that indicate malformed URLs.
    // Multiple consecutive &amp; patterns (HTML entity loop)/.
    if (url.indexOf('&amp;amp;') !== -1) {
      return false
    }

    return true
  } catch {
    return false
  }
}

/**
 * Prepares a URL for use by decoding HTML entities, normalizing protocols,
 * resolving relative URLs, and optionally validating for security issues.
 */
export const prepareUrl = (
  url: string,
  options?: {
    base?: string
    validate?: boolean
  },
): string | undefined => {
  let processed = url

  processed = decodeHTML(url)
  processed = resolveNonStandardFeedUrl(processed)
  processed = resolveProtocolRelativeUrl(processed)

  // Step 4: Resolve relative URLs if base is provided
  if (options?.base && !isAbsoluteUrl(processed)) {
    try {
      processed = new URL(processed, options.base).href
    } catch {
      return
    }
  }

  // Step 5: Normalize using native URL constructor (canonical form)
  try {
    const parsed = new URL(processed)
    processed = parsed.href
  } catch {
    return
  }

  const shouldValidate = options?.validate ?? true

  if (shouldValidate && !validateUrl(processed)) {
    return
  }

  return processed
}

export const isOneOfDomains = (url: string, domains: Array<string>): boolean => {
  try {
    const hostname = new URL(url).hostname
    return domains.some((domain) => hostname === domain || hostname.endsWith(`.${domain}`))
  } catch {
    return false
  }
}

/**
 * Validates that an IP address is not a private/internal address.
 * Uses ipaddr.js for comprehensive validation including:
 * - RFC1918 private (10.0.0.0/8, 172.16.0.0/12, 192.168.0.0/16)
 * - Loopback (127.0.0.0/8, ::1)
 * - Link-local (169.254.0.0/16, fe80::/10)
 * - Carrier-grade NAT (100.64.0.0/10)
 * - Reserved/documentation ranges
 * - IPv4-mapped IPv6 addresses
 */
export const isSafePublicIp = (ip: string): boolean => {
  // UNSAFE: Disable SSRF protection for localhost. Only use in isolated test environments.
  if (process.env.UNSAFE_DISABLE_SSRF_CHECK === 'true') {
    try {
      const addr = ipaddr.process(ip)
      if (addr.range() === 'loopback') {
        return true
      }
    } catch {
      // Fall through to normal validation.
    }
  }

  try {
    if (!ipaddr.isValid(ip)) {
      return false
    }

    const addr = ipaddr.process(ip)
    const range = addr.range()

    const blockedRanges = [
      'unspecified',
      'broadcast',
      'multicast',
      'linkLocal',
      'loopback',
      'private',
      'carrierGradeNat',
      'reserved',
      'uniqueLocal',
    ]

    return !blockedRanges.includes(range)
  } catch {
    return false
  }
}
