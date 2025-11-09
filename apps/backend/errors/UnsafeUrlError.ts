/**
 * Error thrown when a URL targets private/internal resources (SSRF protection).
 * Should not be retried as it's a security violation.
 */
export class UnsafeUrlError extends Error {
  public readonly isRetryable = false

  constructor(public readonly url: string) {
    super(`URL targets private or internal resources: ${url}`)
    this.name = 'UnsafeUrlError'
  }
}
