import fastifyCompress from '@fastify/compress'
import * as serverConstants from '~/constants/server.js'
import { app } from './instances/server.js'
import { FastifyError, FastifyReply, FastifyRequest } from 'fastify'
import { HttpError } from './helpers/routes.js'
import { isDev } from './constants/app.js'

const boot = async () => {
    await import('~/routes/index.js')
    await import('~/routes/health.js')
    await import('~/routes/channels.js')
    await import('~/routes/items.js')
    await import('~/routes/sources.js')
    await import('~/routes/preview.js')

    app.register(fastifyCompress)

    app.setErrorHandler((error: FastifyError, request: FastifyRequest, reply: FastifyReply) => {
        if (error instanceof HttpError) {
            return reply.status(error.statusCode).send({
                message: error.message,
                data: error.data,
            })
        }

        return reply.status(error.statusCode || 500).send({
            message: error.message,
            data: isDev ? error : undefined,
        })
    })

    app.listen({ port: serverConstants.port, host: serverConstants.host }, (err, address) => {
        if (err) {
            console.error(err)
            process.exit(1)
        }
        console.log(`Server running on ${address}`)
    })
}

boot()
