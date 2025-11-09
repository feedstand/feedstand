/**
 * Error thrown when a page is protected by bot detection (Cloudflare, reCAPTCHA, etc).
 * Should not be retried as it will fail the same way.
 */
export class GuardedPageError extends Error {
  public readonly isRetryable = false

  constructor(public readonly guardType: string) {
    super(`Guarded page, signature: ${guardType}`)

    this.name = 'GuardedPageError'
  }
}
