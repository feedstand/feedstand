import { startSpan, withScope } from '@sentry/node'
import { type Processor, Queue, type QueueOptions, Worker, type WorkerOptions } from 'bullmq'
import { hasWorkerFeature } from '../constants/features.ts'
import { GuardedUrlError } from '../errors/GuardedUrlError.ts'
import { RateLimitError } from '../errors/RateLimitError.ts'
import { UnreachableUrlError } from '../errors/UnreachableUrlError.ts'
import { UnsafeUrlError } from '../errors/UnsafeUrlError.ts'
import { incrementMetric, recordDistribution } from '../helpers/metrics.ts'
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
      if (
        error instanceof GuardedUrlError ||
        error instanceof UnreachableUrlError ||
        error instanceof UnsafeUrlError
      ) {
        console.warn('[Job Failed] Permanent failure:', {
          jobId: job.id,
          jobName: job.name,
          queueName: job.queueName,
          errorType: error.constructor.name,
          errorMessage: error.message,
          url: (error as any).url,
          cause: (error as any).cause?.message,
          causeCode: (error as any).cause?.code,
          stack: error.stack?.split('\n').slice(0, 3).join('\n'),
        })

        await job.moveToFailed(error, job.token || '', true)

        // For permanent failures, manually fail the job and return.
        return undefined as Result
      }

      if (error instanceof RateLimitError) {
        const delayMs = await getRateLimitDelay(error.url)
        const domain = new URL(error.url).hostname
        const now = Date.now()
        const delayUntil = Math.max(now + 1000, now + delayMs)
        const actualDelayMs = delayUntil - now

        console.debug('[Rate Limit] Job delayed:', {
          jobId: job.id,
          jobName: job.name,
          url: error.url,
          domain,
          delayMs,
          actualDelayMs,
          delayUntil,
          now,
        })

        if (delayMs < 0) {
          console.warn('[Rate Limit] Negative delay detected:', {
            jobId: job.id,
            url: error.url,
            delayMs,
            correctedTo: actualDelayMs,
          })
        }

        incrementMetric('rate_limit.job_delayed', 1, { queue: job.queueName, domain })
        recordDistribution('rate_limit.delay_ms', actualDelayMs, 'millisecond', {
          queue: job.queueName,
          domain,
        })
        await job.moveToDelayed(delayUntil, job.token)

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
