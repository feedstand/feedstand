import { createInsertSchema } from 'drizzle-zod'
import { z } from 'zod'
import { sources } from '~/database/tables.js'
import { parseRequestToSchema } from '~/helpers/routes.js'
import { app } from '~/instances/server.js'

app.post('/sources', (request, reply) => {
    const schema = z.object({ body: createInsertSchema(sources, { channelId: z.undefined() }) })
    const { body } = parseRequestToSchema({ request, reply, schema, showErrors: true })

    return reply.send(body)
})
