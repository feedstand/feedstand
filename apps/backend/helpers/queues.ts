import { startSpan, withScope } from '@sentry/node'
import { type Processor, Queue, type QueueOptions, Worker, type WorkerOptions } from 'bullmq'
import { hasWorkerFeature } from '../constants/features.ts'
import { GuardedPageError } from '../errors/GuardedPageError.ts'
import { UnsafeUrlError } from '../errors/UnsafeUrlError.ts'
import { connection } from '../instances/queue.ts'
import { sentry } from '../instances/sentry.ts'

const failingErrors = [GuardedPageError, UnsafeUrlError]

export const createQueue = <Data, Result, Name extends string>(
  name: string,
  actions: Record<Name, (data: Data) => Result>,
  options?: { queue?: Partial<QueueOptions>; worker?: Partial<WorkerOptions> },
) => {
  const queue: Queue<Data, Result, Name> = new Queue(name, { ...options?.queue, connection })

  if (!hasWorkerFeature) {
    return queue
  }

  const processor: Processor<Data, Result, Name> = async (job) => {
    try {
      const options = {
        op: 'queue.task',
        name: `${name}.${job.name}`,
        attributes: {
          'job.id': job.id,
          'job.name': job.name,
          'job.queueName': job.queueName,
        },
      }

      return await startSpan(options, () => actions[job.name](job.data))
    } catch (error) {
      if (failingErrors.includes(error.constructor)) {
        await job.moveToFailed(error, '', true)
        // For permanent failures, manually fail the job and return.
        return undefined as Result
      }

      throw error
    }
  }

  const worker = new Worker<Data, Result, Name>(name, processor, { ...options?.worker, connection })

  queue.on('error', (error) => sentry?.captureException?.(error))
  worker.on('error', (error) => sentry?.captureException?.(error))
  worker.on('failed', (job, error) => {
    withScope((scope) => {
      scope.setTag('job.id', job?.id)
      scope.setTag('job.name', job?.name)
      scope.setTag('job.queueName', job?.queueName)
      sentry?.captureException?.(error, undefined, scope)
    })
  })

  return queue
}
