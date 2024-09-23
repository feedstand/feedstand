import { composeQueue } from '~/helpers/queues'
import { scanExistingChannel } from '~/actions/scanExistingChannel'

export const channelsQueue = composeQueue('channels', {
    scan: scanExistingChannel,
})
