import { eq } from 'drizzle-orm'
import { HTTPException } from 'hono/http-exception'
import { z } from 'zod'
import { tables } from '~/database/tables'
import { validate } from '~/helpers/routes'
import { db } from '~/instances/database'
import { hono } from '~/instances/hono'

const paramSchema = z.object({ id: z.coerce.number() })

hono.get('/channels/:id', validate('param', paramSchema), async (context) => {
    const params = context.req.valid('param')

    const [channel] = await db
        .select()
        .from(tables.channels)
        .where(eq(tables.channels.id, params.id))
        .limit(1)

    if (!channel) {
        throw new HTTPException(404)
    }

    return context.json(channel)
})
