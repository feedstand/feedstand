import { composeQueue } from '~/helpers/queue.js'
import { scanExistingChannel } from '~/actions/scanExistingChannel.js'

export const channelsQueue = composeQueue('channels', {
    scan: scanExistingChannel,
})
