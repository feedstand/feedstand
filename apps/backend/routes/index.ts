import { app } from '~/instances/server.js'

app.get('/', (request, reply) => {
    reply
        .type('application/json')
        .status(200)
        .send({ message: `Hello world! Hash: ${process.env.VERSION_TAG}` })
})
