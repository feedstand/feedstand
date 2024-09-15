import { composeQueue } from '~/helpers/queue.js'
import { scanChannel } from '~/actions/scanChannel.js'

export const channelsQueue = composeQueue('channels', {
    scan: scanChannel,
})
