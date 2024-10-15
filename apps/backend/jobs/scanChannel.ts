import { scanExistingChannel } from '../actions/scanExistingChannel'
import { Channel } from '../types/schemas'

export const scanChannel = async (channel: Channel) => {
    scanExistingChannel(channel)
}
