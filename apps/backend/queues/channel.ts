import { createQueue } from '../helpers/queues'
import { fixChannel } from '../jobs/fixChannel'
import { scanChannel } from '../jobs/scanChannel'

export const channelQueue = createQueue(
    'channel',
    { scanChannel, fixChannel },
    { worker: { concurrency: 10 } },
)
