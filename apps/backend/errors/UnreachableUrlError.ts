/**
 * Error thrown when a URL cannot be reached after all retry attempts.
 * Should not be retried at job level since Got already retried multiple times.
 */
export class UnreachableUrlError extends Error {
  public readonly isRetryable = false

  constructor(
    public readonly url: string,
    public readonly cause?: Error,
  ) {
    super(`URL unreachable after retries: ${url}`)

    this.name = 'UnreachableUrlError'
  }
}
