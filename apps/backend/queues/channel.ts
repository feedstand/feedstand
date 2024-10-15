import { createQueue } from '../helpers/queues'
import { scanChannel } from '../jobs/scanChannel'

export const channelQueue = createQueue('channel', {
    scanChannel,
})
