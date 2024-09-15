import { channelsQueue } from '~/queue/channels.js'
import { router } from '~/instances/server.js'

router.get('/', (context) => {
    context.type = 'application/json'
    context.status = 200
    context.body = { message: `Hello world! Hash: ${process.env.VERSION_TAG}` }

    channelsQueue.add('scan', 1)
})
