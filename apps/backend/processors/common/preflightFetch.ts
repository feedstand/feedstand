import { isUrlFresh } from '../../actions/isUrlFresh.ts'
import type { WorkflowProcessor } from '../../helpers/workflows.ts'
import type { Channel } from '../../types/schemas.ts'

export type PreflightFetch = <TResult, TOptions>(
  etagProperty: keyof Channel,
  lastModifiedProperty: keyof Channel,
) => WorkflowProcessor<TResult, TOptions>

export const preflightFetch: PreflightFetch = (etagProperty, lastModifiedProperty) => {
  return async (context, next) => {
    const etag = context.channel?.[etagProperty]
    const lastModified = context.channel?.[lastModifiedProperty]

    if (context.response?.ok || (!etag && !lastModified)) {
      return await next()
    }

    try {
      const { isFresh, response } = await isUrlFresh(
        context.url,
        etag?.toString(),
        lastModified?.toString(),
      )

      if (isFresh) {
        context.response = response
      }
    } catch (error) {
      context.error = error
    }

    await next()
  }
}
