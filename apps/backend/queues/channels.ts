import { JobsOptions } from 'bullmq'
import * as queueConstants from '../constants/queue'
import { createQueue } from '../helpers/queues'
import { deleteOrphanChannels } from '../jobs/deleteOrphanChannels'
import { scanChannels } from '../jobs/scanChannels'

export const channelsQueue = createQueue('channels', {
    deleteOrphanChannels,
    scanChannels,
})

if (queueConstants.isEnabled) {
    const repeatableJobOptions: JobsOptions = {
        repeat: { pattern: '*/15 * * * *' },
        removeOnComplete: false,
        removeOnFail: false,
    }

    const addRepeatableJobs = () => {
        channelsQueue.add('deleteOrphanChannels', undefined, repeatableJobOptions)
        channelsQueue.add('scanChannels', undefined, repeatableJobOptions)
    }

    setInterval(addRepeatableJobs, 5 * 60 * 1000)
    addRepeatableJobs()
}
