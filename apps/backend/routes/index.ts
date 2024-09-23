import { app } from '~/instances/server'

app.get('/', async (request, reply) => {
    reply
        .type('application/json')
        .status(200)
        .send({ message: `Hello world! Hash: ${process.env.VERSION_TAG}` })
})
