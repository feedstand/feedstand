import { app } from '~/instances/server'

app.get('/', async (request, reply) => {
    reply.status(200).send()
})
