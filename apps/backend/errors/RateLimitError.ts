/**
 * Error thrown when a request is rate limited by the target server.
 * Should be retried after backoff period.
 */
export class RateLimitError extends Error {
  public readonly url: string

  constructor(url: string, message = 'Rate limited') {
    super(`${message}: ${url}`)

    this.name = 'RateLimitError'
    this.url = url
  }
}
