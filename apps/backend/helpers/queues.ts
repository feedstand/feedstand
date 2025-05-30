import { withScope } from '@sentry/node'
import { type Processor, Queue, type QueueOptions, Worker, type WorkerOptions } from 'bullmq'
import { hasWorkerFeature } from '../constants/features.ts'
import { connection } from '../instances/queue.ts'
import { sentry } from '../instances/sentry.ts'

export const createQueue = <Data, Result, Name extends string>(
  name: string,
  actions: Record<Name, (data: Data) => Result>,
  opts?: { queue?: Partial<QueueOptions>; worker?: Partial<WorkerOptions> },
) => {
  const queue: Queue<Data, Result, Name> = new Queue(name, { ...opts?.queue, connection })

  if (!hasWorkerFeature) {
    return queue
  }

  const processor: Processor<Data, Result, Name> = async (job) => {
    return await actions[job.name](job.data)
  }

  const worker = new Worker<Data, Result, Name>(name, processor, { ...opts?.worker, connection })

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
