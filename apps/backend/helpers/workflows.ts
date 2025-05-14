import type { CustomResponse } from '../actions/fetchUrl.ts'
import type { Channel } from '../types/schemas.ts'

export type Workflow<T> = (context: WorkflowContext<T>) => Promise<T>

export type WorkflowContext<T> = {
  url: string
  response?: CustomResponse
  channel?: Channel
  error?: unknown
  result?: T
}

export type WorkflowNext = () => Promise<void>

export type WorkflowProcessor<T> = (
  context: WorkflowContext<T>,
  next: WorkflowNext,
  self: Workflow<T>,
) => Promise<void>

export const createWorkflow = <T>(processors: Array<WorkflowProcessor<T>>): Workflow<T> => {
  const workflow: Workflow<T> = async (context) => {
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
