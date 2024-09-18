import { FastifyReply, FastifyRequest } from 'fastify'
import { ZodError, ZodSchema, z } from 'zod'

export class HttpError extends Error {
    statusCode: number
    data: unknown

    constructor(statusCode: number, { message, data }: { message?: string; data?: unknown } = {}) {
        super(message)
        this.statusCode = statusCode
        this.data = data
    }
}

export const parseRequestToSchema = <S extends ZodSchema = never>({
    request,
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
            throw new HttpError(422, {
                message: error.message,
                data: showErrors ? error.errors : undefined,
            })
        }

        throw error
    }
}
