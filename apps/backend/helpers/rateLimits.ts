import { RateLimitError } from '../errors/RateLimitError.ts'
import { connection } from '../instances/queue.ts'
import { incrementMetric, recordDistribution } from './metrics.ts'

const RATE_LIMIT_PREFIX = 'rate_limit:'
const MAX_DELAY_SECONDS = 3600 // 1 hour - prevent DoS from malicious headers

export const checkRateLimit = async (url: string): Promise<void> => {
  const domain = new URL(url).hostname
  const key = `${RATE_LIMIT_PREFIX}${domain}`

  const isLimited = await connection.get(key)

  if (isLimited) {
    const remainingSeconds = await connection.ttl(key)
    console.debug('[Rate Limit] Preflight blocked:', {
      domain,
      url,
      remainingSeconds,
    })
    incrementMetric('rate_limit.preflight_blocked', 1, { domain })
    throw new RateLimitError(url, `${domain} (cached)`)
  }
}

export const markRateLimited = async (url: string, durationSeconds: number): Promise<void> => {
  const domain = new URL(url).hostname
  const key = `${RATE_LIMIT_PREFIX}${domain}`

  console.debug('[Rate Limit] Domain marked:', {
    domain,
    url,
    durationSeconds,
  })

  incrementMetric('rate_limit.domain_marked', 1, { domain })
  recordDistribution('rate_limit.duration_seconds', durationSeconds, 'second', { domain })

  await connection.setex(key, durationSeconds, '1')
}

export const getRateLimitDuration = (headers: Headers, fallbackSeconds: number): number => {
  const retryAfter = headers.get('retry-after')
  if (retryAfter) {
    const retrySeconds = Number.parseInt(retryAfter, 10)
    if (!Number.isNaN(retrySeconds) && retrySeconds >= 0) {
      return Math.min(retrySeconds, MAX_DELAY_SECONDS)
    }

    const retryTime = new Date(retryAfter).getTime()
    if (!Number.isNaN(retryTime)) {
      const seconds = Math.max(0, Math.floor((retryTime - Date.now()) / 1000))
      return Math.min(seconds, MAX_DELAY_SECONDS)
    }
  }

  const rateLimitReset = headers.get('ratelimit-reset')
  if (rateLimitReset) {
    const seconds = Number.parseInt(rateLimitReset, 10)
    if (!Number.isNaN(seconds) && seconds >= 0) {
      return Math.min(seconds, MAX_DELAY_SECONDS)
    }
  }

  const resetTimestamp = headers.get('x-ratelimit-reset')
  if (resetTimestamp) {
    const resetTime = Number.parseInt(resetTimestamp, 10)
    if (!Number.isNaN(resetTime)) {
      const seconds = Math.max(0, resetTime - Math.floor(Date.now() / 1000))
      return Math.min(seconds, MAX_DELAY_SECONDS)
    }
  }

  return Math.min(fallbackSeconds, MAX_DELAY_SECONDS)
}

export const getRateLimitDelay = async (url: string): Promise<number> => {
  const domain = new URL(url).hostname
  const key = `${RATE_LIMIT_PREFIX}${domain}`

  const ttl = await connection.ttl(key)
  const delayMs = ttl > 0 ? (ttl + 5) * 1000 : 60000

  console.debug('[Rate Limit] Get delay:', {
    domain,
    url,
    ttl,
    delayMs,
  })

  // TTL in seconds, convert to milliseconds and add small buffer
  return delayMs
}
