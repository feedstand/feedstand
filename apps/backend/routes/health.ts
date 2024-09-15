import { app } from '~/instances/server.js'

app.get('/health', async (request, reply) => {
    reply.status(200).send()
})
