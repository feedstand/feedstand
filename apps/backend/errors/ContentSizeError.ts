/**
 * Error thrown when content size exceeds the configured limit.
 * Can be thrown either when Content-Length header declares size exceeding limit (fail-fast),
 * or when downloaded bytes exceed limit during streaming (safety net).
 */
export class ContentSizeError extends Error {
  public readonly isRetryable = false

  constructor(
    public readonly url: string,
    public readonly limit: number,
    public readonly size: number,
    public readonly isDeclared: boolean,
  ) {
    const source = isDeclared ? 'declared' : 'actual'
    super(`Content size exceeds limit (${source}): ${size} > ${limit} for ${url}`)

    this.name = 'ContentSizeError'
  }
}
