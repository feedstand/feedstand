import { describe, expect, it } from 'vitest'
import { getRateLimitDuration } from './rateLimits.ts'

describe('getRateLimitDuration', () => {
  it('should return seconds from Retry-After header when numeric', () => {
    const headers = new Headers({ 'retry-after': '300' })
    const result = getRateLimitDuration(headers, 60)

    expect(result).toBe(300)
  })

  it('should parse Retry-After header as HTTP date', () => {
    const futureDate = new Date(Date.now() + 300000) // 5 minutes in future
    const headers = new Headers({ 'retry-after': futureDate.toUTCString() })
    const result = getRateLimitDuration(headers, 60)

    expect(result).toBeGreaterThanOrEqual(299)
    expect(result).toBeLessThanOrEqual(300)
  })

  it('should return seconds from RateLimit-Reset header', () => {
    const headers = new Headers({ 'ratelimit-reset': '180' })
    const result = getRateLimitDuration(headers, 60)

    expect(result).toBe(180)
  })

  it('should parse X-RateLimit-Reset header as Unix timestamp', () => {
    const resetTime = Math.floor(Date.now() / 1000) + 600 // 10 minutes from now
    const headers = new Headers({ 'x-ratelimit-reset': resetTime.toString() })
    const result = getRateLimitDuration(headers, 60)

    expect(result).toBeGreaterThanOrEqual(599)
    expect(result).toBeLessThanOrEqual(600)
  })

  it('should return fallback when no rate limit headers present', () => {
    const headers = new Headers()
    const result = getRateLimitDuration(headers, 120)

    expect(result).toBe(120)
  })

  it('should prioritize Retry-After over other headers', () => {
    const headers = new Headers({
      'retry-after': '100',
      'ratelimit-reset': '200',
      'x-ratelimit-reset': '300',
    })
    const result = getRateLimitDuration(headers, 60)

    expect(result).toBe(100)
  })

  it('should prioritize RateLimit-Reset over X-RateLimit-Reset', () => {
    const headers = new Headers({
      'ratelimit-reset': '150',
      'x-ratelimit-reset': '300',
    })
    const result = getRateLimitDuration(headers, 60)

    expect(result).toBe(150)
  })

  it('should handle invalid Retry-After numeric value', () => {
    const headers = new Headers({ 'retry-after': 'invalid' })
    const result = getRateLimitDuration(headers, 60)

    expect(result).toBe(60)
  })

  it('should handle invalid RateLimit-Reset value', () => {
    const headers = new Headers({ 'ratelimit-reset': 'invalid' })
    const result = getRateLimitDuration(headers, 60)

    expect(result).toBe(60)
  })

  it('should handle invalid X-RateLimit-Reset value', () => {
    const headers = new Headers({ 'x-ratelimit-reset': 'invalid' })
    const result = getRateLimitDuration(headers, 60)

    expect(result).toBe(60)
  })

  it('should handle past date in Retry-After header', () => {
    const pastDate = new Date(Date.now() - 300000) // 5 minutes in past
    const headers = new Headers({ 'retry-after': pastDate.toUTCString() })
    const result = getRateLimitDuration(headers, 60)

    expect(result).toBe(0)
  })

  it('should handle past timestamp in X-RateLimit-Reset header', () => {
    const pastTimestamp = Math.floor(Date.now() / 1000) - 300 // 5 minutes ago
    const headers = new Headers({ 'x-ratelimit-reset': pastTimestamp.toString() })
    const result = getRateLimitDuration(headers, 60)

    expect(result).toBe(0)
  })

  it('should be case-insensitive for header names', () => {
    const headers = new Headers({ 'Retry-After': '250' })
    const result = getRateLimitDuration(headers, 60)

    expect(result).toBe(250)
  })

  it('should cap Retry-After at 1 hour maximum', () => {
    const headers = new Headers({ 'retry-after': '999999' })
    const result = getRateLimitDuration(headers, 60)

    expect(result).toBe(3600) // 1 hour max
  })

  it('should cap RateLimit-Reset at 1 hour maximum', () => {
    const headers = new Headers({ 'ratelimit-reset': '7200' })
    const result = getRateLimitDuration(headers, 60)

    expect(result).toBe(3600) // 1 hour max
  })

  it('should cap X-RateLimit-Reset at 1 hour maximum', () => {
    const futureTimestamp = Math.floor(Date.now() / 1000) + 10000 // Way in future
    const headers = new Headers({ 'x-ratelimit-reset': futureTimestamp.toString() })
    const result = getRateLimitDuration(headers, 60)

    expect(result).toBe(3600) // 1 hour max
  })

  it('should cap fallback at 1 hour maximum', () => {
    const headers = new Headers()
    const result = getRateLimitDuration(headers, 9999)

    expect(result).toBe(3600) // 1 hour max
  })

  it('should reject negative Retry-After numeric values and fall back', () => {
    const headers = new Headers({ 'retry-after': '-100' })
    const result = getRateLimitDuration(headers, 60)

    // Negative number fails numeric check, then gets parsed as date (invalid),
    // which results in fallback
    expect(result).toBe(0) // Treated as past date
  })

  it('should reject negative RateLimit-Reset values', () => {
    const headers = new Headers({ 'ratelimit-reset': '-50' })
    const result = getRateLimitDuration(headers, 60)

    expect(result).toBe(60) // Falls back
  })

  it('should cap HTTP date far in future at 1 hour', () => {
    const farFuture = new Date(Date.now() + 10000000) // Very far future
    const headers = new Headers({ 'retry-after': farFuture.toUTCString() })
    const result = getRateLimitDuration(headers, 60)

    expect(result).toBe(3600) // 1 hour max
  })
})
