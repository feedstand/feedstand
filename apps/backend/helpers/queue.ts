import { Processor, Queue, Worker } from 'bullmq'
import { connection } from '~/instances/queue'

export const composeQueue = <Data, Result, Name extends string>(
    name: string,
    actions: Record<Name, (data: Data) => Result>,
) => {
    const queue: Queue<Data, Result, Name> = new Queue(name, { connection })

    const processor: Processor<Data, Result, Name> = async (job) => {
        return await actions[job.name](job.data)
    }

    new Worker<Data, Result, Name>(name, processor, { connection })

    return queue
}
