import type { FetchUrlResponse } from '../actions/fetchUrl.ts'

/**
 * Error thrown when server returns 304 Not Modified.
 *
 * FRB014: Server may return updated ETag/Last-Modified headers even when body unchanged.
 * This error preserves the response so headers can be extracted and stored atomically.
 *
 * Background (NetNewsWire Issue #4345):
 * If we don't update our stored cache headers from 304 responses, the next fetch will
 * send stale conditional headers, causing the server to return 200 OK (full body)
 * instead of 304 Not Modified (no body).
 */
export class NotModifiedError extends Error {
  public readonly response: FetchUrlResponse

  constructor(response: FetchUrlResponse) {
    super('Not Modified')

    this.name = 'NotModifiedError'
    this.cause = 304
    this.response = response
  }
}
