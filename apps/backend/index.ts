import fastifyCompress from '@fastify/compress'
import * as serverConstants from '~/constants/server'
import { app } from './instances/server'
import { FastifyError, FastifyReply, FastifyRequest } from 'fastify'
import { HttpError } from './helpers/routes'
import { isDev } from './constants/app'
import { importFilesFromDirectory } from './helpers/files'

const boot = async () => {
    await importFilesFromDirectory('./routes')

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
