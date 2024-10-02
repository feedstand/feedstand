import { JobsOptions } from 'bullmq'
import { createQueue } from '../helpers/queues'
import { deleteOrphanChannels } from '../jobs/deleteOrphanChannels'
import { scanChannels } from '../jobs/scanChannels'

export const channelsQueue = createQueue('channels', {
    deleteOrphanChannels,
    scanChannels,
})

const repeatableJobOptions: JobsOptions = {
    repeat: { pattern: '*/15 * * * *', limit: 0 },
    removeOnComplete: false,
    removeOnFail: false,
}

setInterval(
    () => {
        channelsQueue.add('deleteOrphanChannels', undefined, repeatableJobOptions)
        channelsQueue.add('scanChannels', undefined, repeatableJobOptions)
    },
    5 * 60 * 1000,
)
