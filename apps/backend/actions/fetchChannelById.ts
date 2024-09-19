import { HttpError, parseRequestToSchema } from '~/helpers/routes.js'
import { z } from 'zod'
import { db } from '~/instances/database.js'
import { FastifyRequest } from 'fastify'
import { Channel } from '~/types/database.js'

export const fetchChannelById = async (request: FastifyRequest): Promise<Channel> => {
    const schema = z.object({ params: z.object({ id: z.coerce.number() }) })
    const { params } = parseRequestToSchema({ request, schema })

    const channel = await db.query.channels.findFirst({
        where: (channels, { eq }) => eq(channels.id, params.id),
    })

    if (!channel) {
        throw new HttpError(404)
    }

    return channel
}
