import { Channel } from '../types/schemas'

export type Workflow<T> = (context: WorkflowContext<T>) => Promise<T>

export type WorkflowContext<T> = {
    url: string
    response?: Response
    channel?: Channel
    error?: unknown
    result?: T
}

export type WorkflowNext = () => Promise<void>

export type WorkflowProcessor<T> = (
    context: WorkflowContext<T>,
    next: WorkflowNext,
) => Promise<void>

export const createWorkflow = <T>(processors: Array<WorkflowProcessor<T>>): Workflow<T> => {
    return async (context) => {
        let index = 0

        const next: WorkflowNext = async () => {
            const processsor = processors[index++]

            if (!processsor) {
                return
            }

            await processsor(context, next)
        }

        await next()

        if (context.result) {
            return context.result
        }

        if (context.error) {
            throw context.error
        }

        throw new Error(
            `Unprocessed pipeline, HTTP code: ${context.response?.status || 'Unknown'}`,
            { cause: context.response?.status },
        )
    }
}
