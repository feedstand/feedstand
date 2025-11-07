// import type { JobsOptions } from 'bullmq'
import { createQueue } from '../helpers/queues.ts'
import { deleteOrphanChannels } from '../jobs/deleteOrphanChannels.ts'
import { fixChannels } from '../jobs/fixChannels.ts'
import { scanChannels } from '../jobs/scanChannels.ts'

export const channelsQueue = createQueue('channels', {
  deleteOrphanChannels,
  scanChannels,
  fixChannels,
})

// const repeatableJobOptions: JobsOptions = {
//   repeat: { pattern: '*/15 * * * *' },
//   removeOnComplete: false,
//   removeOnFail: false,
// }

const addRepeatableJobs = () => {
  // channelsQueue.add('deleteOrphanChannels', undefined, repeatableJobOptions)
  // channelsQueue.add('scanChannels', undefined, repeatableJobOptions)
  // channelsQueue.add('fixChannels', undefined, repeatableJobOptions)
}

setInterval(addRepeatableJobs, 5 * 60 * 1000)
addRepeatableJobs()
