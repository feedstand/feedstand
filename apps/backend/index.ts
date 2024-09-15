import fastifyCompress from '@fastify/compress'
import * as serverConstants from '~/constants/server.js'
import { app } from './instances/server.js'

const boot = async () => {
    await import('~/routes/index.js')
    await import('~/routes/health.js')

    app.register(fastifyCompress)

    app.listen({ port: serverConstants.port, host: serverConstants.host }, (err, address) => {
        if (err) {
            console.error(err)
            process.exit(1)
        }
        console.log(`Server running on ${address}`)
    })
}

boot()
