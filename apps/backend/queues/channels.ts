import type { JobsOptions } from 'bullmq'
import { createQueue } from '../helpers/queues.js'
import { deleteOrphanChannels } from '../jobs/deleteOrphanChannels.js'
import { fixChannels } from '../jobs/fixChannels.js'
import { scanChannels } from '../jobs/scanChannels.js'

export const channelsQueue = createQueue('channels', {
  deleteOrphanChannels,
  scanChannels,
  fixChannels,
})

const repeatableJobOptions: JobsOptions = {
  repeat: { pattern: '*/15 * * * *' },
  removeOnComplete: false,
  removeOnFail: false,
}

const addRepeatableJobs = () => {
  // channelsQueue.add('deleteOrphanChannels', undefined, repeatableJobOptions)
  // channelsQueue.add('scanChannels', undefined, repeatableJobOptions)
  // channelsQueue.add('fixChannels', undefined, repeatableJobOptions)
}

setInterval(addRepeatableJobs, 5 * 60 * 1000)
addRepeatableJobs()
