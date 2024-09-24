import { scanExistingChannel } from '~/actions/scanExistingChannel'
import { composeQueue } from '~/helpers/queues'

export const channelsQueue = composeQueue('channels', {
    scan: scanExistingChannel,
})
