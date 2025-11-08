import type { WorkflowProcessor } from '../../helpers/workflows.ts'

export const failedPage: WorkflowProcessor<unknown> = async (context, next) => {
  if (!context.error) {
    return await next()
  }

  if (context.error instanceof Error && context.error.cause) {
    context.error = context.error.cause
  }

  await next()
}
