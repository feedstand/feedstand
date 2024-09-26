import { composeQueue } from '../helpers/queues'
import { deleteOrphanChannels } from '../jobs/deleteOrphanChannels'
import { scanChannels } from '../jobs/scanChannels'

export const channelsQueue = composeQueue('channels', {
    deleteOrphanChannels,
    scanChannels,
})

channelsQueue.add('deleteOrphanChannels', undefined, { repeat: { pattern: '*/15 * * * *' } })
channelsQueue.add('scanChannels', undefined, { repeat: { pattern: '*/15 * * * *' } })
