import { channelsQueue } from '~/queue/channels.js'
import { app } from '~/instances/server.js'
import { parseRequestToSchema } from '~/helpers/routes.js'
import { z } from 'zod'

app.get('/channels/:id', (request, reply) => {
    const schema = z.object({ params: z.object({ id: z.coerce.number() }) })
    const { params } = parseRequestToSchema({ request, reply, schema, showErrors: true })

    channelsQueue.add('scan', params.id)
    reply.status(200).send({ message: `Channel ${params.id} added to queue for scanning` })
})
