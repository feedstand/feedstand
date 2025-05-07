import { createQueue } from '../helpers/queues.ts'
import { fixChannel } from '../jobs/fixChannel.ts'
import { scanChannel } from '../jobs/scanChannel.ts'

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
