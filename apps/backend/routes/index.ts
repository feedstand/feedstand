import { channelsQueue } from '~/queue/channels.js'
import { app } from '~/instances/server.js'

app.get('/', async (request, reply) => {
    reply
        .type('application/json')
        .status(200)
        .send({ message: `Hello world! Hash: ${process.env.VERSION_TAG}` })

    await channelsQueue.add('scan', 1)
})
