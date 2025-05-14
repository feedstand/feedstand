import type { WorkflowProcessor } from '../../helpers/workflows.ts'

// biome-ignore lint/suspicious/noExplicitAny: Don't need to explain myself.
export const failedPage: WorkflowProcessor<any> = async (context, next) => {
  if (!context.error) {
    return await next()
  }

  if (context.error instanceof Error && context.error.cause) {
    context.error = context.error.cause
  }

  await next()
}
