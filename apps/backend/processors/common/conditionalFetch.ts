import { fetchUrl } from '../../actions/fetchUrl.ts'
import { NotModifiedError } from '../../errors/NotModifiedError.ts'
import type { WorkflowProcessor } from '../../helpers/workflows.ts'
import type { Channel } from '../../types/schemas.ts'

/**
 * Fetch processor - sends conditional GET if cache headers available, unconditional otherwise.
 *
 * FRB001: Consistently recognizes and stores Last-Modified data from server responses.
 * FRB002: Generates well-formed conditional requests with If-Modified-Since headers.
 * FRB003: Consistently recognizes and stores ETag data from server responses.
 * FRB004: Generates well-formed conditional requests with If-None-Match headers.
 * FRB012: No "creative" If-Modified-Since parameters - uses server's exact value.
 * FRB013: No "creative" If-None-Match parameters - uses server's exact value.
 * FRB051: Never uses HEAD method - uses conditional GET instead.
 */
export type ConditionalFetch = <TResult, TOptions>(
  etagProperty: keyof Channel,
  lastModifiedProperty: keyof Channel,
) => WorkflowProcessor<TResult, TOptions>

export const conditionalFetch: ConditionalFetch = (etagProperty, lastModifiedProperty) => {
  return async (context, next) => {
    if (context.response?.ok) {
      return await next()
    }

    const etag = context.channel?.[etagProperty]
    const lastModified = context.channel?.[lastModifiedProperty]

    try {
      const response = await fetchUrl(context.url, {
        headers: {
          'If-None-Match': etag?.toString(),
          'If-Modified-Since': lastModified?.toString(),
        },
      })

      if (response.status === 304) {
        throw new NotModifiedError(response)
      }

      context.response = response
    } catch (error) {
      context.error = error
    }

    await next()
  }
}
