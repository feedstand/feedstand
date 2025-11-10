/**
 * Error thrown when a URL is protected by bot detection (Cloudflare, reCAPTCHA, etc).
 * Should not be retried as it will fail the same way.
 */
export class GuardedUrlError extends Error {
  public readonly isRetryable = false

  constructor(public readonly guardType: string) {
    super(`Guarded URL, signature: ${guardType}`)

    this.name = 'GuardedUrlError'
  }
}
