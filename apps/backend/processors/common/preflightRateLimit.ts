import { checkRateLimit } from '../../helpers/rateLimits.ts'
import type { WorkflowProcessor } from '../../helpers/workflows.ts'

// biome-ignore lint/suspicious/noExplicitAny: Don't need to explain myself.
export const preflightRateLimit: WorkflowProcessor<any> = async (context, next) => {
  if (context.result) {
    return await next()
  }

  await checkRateLimit(context.url)

  await next()
}
