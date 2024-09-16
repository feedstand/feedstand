import { FastifyReply, FastifyRequest } from 'fastify'
import { ZodError, ZodSchema, z } from 'zod'

export const parseRequestToSchema = <S extends ZodSchema = never>({
    request,
    reply,
    schema,
    showErrors,
}: {
    request: FastifyRequest
    reply: FastifyReply
    schema: S
    showErrors?: boolean
}): z.infer<S> => {
    try {
        return schema.parse(request)
    } catch (error) {
        if (error instanceof ZodError) {
            reply.status(422).send(showErrors ? error.errors : undefined)
        } else {
            reply.status(500)
        }
    }
}
