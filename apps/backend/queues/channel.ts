import { createQueue } from '../helpers/queues'
import { fixChannel } from '../jobs/fixChannel'
import { scanChannel } from '../jobs/scanChannel'

export const channelQueue = createQueue(
    'channel',
    { scanChannel, fixChannel },
    {
        queue: {
            defaultJobOptions: {
                removeOnComplete: 100,
                removeOnFail: 1000,
                attempts: 5,
                backoff: {
                    type: 'exponential',
                    delay: 5000,
                },
            },
        },
        worker: { concurrency: 10 },
    },
)
