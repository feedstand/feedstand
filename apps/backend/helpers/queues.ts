import { startSpan, withScope } from '@sentry/node'
import { type Processor, Queue, type QueueOptions, Worker, type WorkerOptions } from 'bullmq'
import { hasWorkerFeature } from '../constants/features.ts'
import { GuardedPageError } from '../errors/GuardedPageError.ts'
import { RateLimitError } from '../errors/RateLimitError.ts'
import { UnsafeUrlError } from '../errors/UnsafeUrlError.ts'
import { getRateLimitDelay } from '../helpers/rateLimits.ts'
import { connection } from '../instances/queue.ts'
import { sentry } from '../instances/sentry.ts'

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
    const options = {
      op: 'queue.task',
      name: `${name}.${job.name}`,
      attributes: {
        'job.id': job.id,
        'job.name': job.name,
        'job.queueName': job.queueName,
      },
    }

    try {
      return await startSpan(options, () => actions[job.name](job.data))
    } catch (error) {
      if (error instanceof GuardedPageError || error instanceof UnsafeUrlError) {
        await job.moveToFailed(error, job.token, true)

        // For permanent failures, manually fail the job and return.
        return undefined as Result
      }

      if (error instanceof RateLimitError) {
        const delayMs = await getRateLimitDelay(error.url)
        console.debug('[Rate Limit] Job delayed:', {
          jobId: job.id,
          jobName: job.name,
          url: error.url,
          delayMs,
        })
        await job.moveToDelayed(Date.now() + delayMs, job.token)

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
