import { createQueue } from '../helpers/queues.ts'
import { importFeed } from '../jobs/importFeed.ts'
import { importUrl } from '../jobs/importUrl.ts'

export const importQueue = createQueue(
  'import',
  { importUrl, importFeed },
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
