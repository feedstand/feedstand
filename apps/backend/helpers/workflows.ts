import type { FetchUrlResponse } from '../actions/fetchUrl.ts'
import type { Channel } from '../types/schemas.ts'

export type Workflow<TResult, TOptions = unknown> = (
  context: WorkflowContext<TResult, TOptions>,
) => Promise<TResult>

export type WorkflowContext<TResult, TOptions = unknown> = {
  url: string
  response?: FetchUrlResponse
  channel?: Channel
  error?: unknown
  result?: TResult
  options?: TOptions
}

export type WorkflowNext = () => Promise<void>

export type WorkflowProcessor<TResult, TOptions = unknown> = (
  context: WorkflowContext<TResult, TOptions>,
  next: WorkflowNext,
  self: Workflow<TResult, TOptions>,
) => Promise<void>

export const createWorkflow = <TResult, TOptions = unknown>(
  processors: Array<WorkflowProcessor<TResult, TOptions>>,
): Workflow<TResult, TOptions> => {
  const workflow: Workflow<TResult, TOptions> = async (context) => {
    let index = 0

    const next: WorkflowNext = async () => {
      const processor = processors[index++]

      if (!processor) {
        return
      }

      await processor(context, next, workflow)
    }

    await next()

    if (context.result) {
      return context.result
    }

    if (context.error) {
      throw context.error
    }

    throw new Error(`Unprocessed pipeline, HTTP code: ${context.response?.status || 'Unknown'}`, {
      cause: context.response?.status,
    })
  }

  return workflow
}
