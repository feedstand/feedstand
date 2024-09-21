import { app } from '~/instances/server'

app.get('/health', async (request, reply) => {
    reply.status(200).send()
})
