import { isUrlFresh } from '../../actions/isUrlFresh.js'
import type { WorkflowProcessor } from '../../helpers/workflows.js'
import type { Channel } from '../../types/schemas.js'

export const preflightFetch: (
  etagProperty: keyof Channel,
  dateProperty: keyof Channel,
) => WorkflowProcessor<unknown> = (etagProperty, dateProperty) => {
  return async (context, next) => {
    const etag = context.channel?.[etagProperty]
    const date = context.channel?.[dateProperty]

    if (context.response?.ok || !etag || !date) {
      return await next()
    }

    try {
      const { isFresh, response } = await isUrlFresh(
        context.url,
        etag.toString(),
        date ? new Date(date) : undefined,
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
