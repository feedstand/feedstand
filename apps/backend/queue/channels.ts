import { composeQueue } from '~/helpers/queue'
import { scanExistingChannel } from '~/actions/scanExistingChannel'

export const channelsQueue = composeQueue('channels', {
    scan: scanExistingChannel,
})
