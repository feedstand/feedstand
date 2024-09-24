import { hono } from '~/instances/hono'
import { tables } from '~/database/tables'
import { desc, eq } from 'drizzle-orm'
import { db } from '~/instances/database'
import { validate } from '~/helpers/routes'
import { z } from 'zod'
import { HTTPException } from 'hono/http-exception'

const paramSchema = z.object({ id: z.number() })

hono.get('/channels/:id/items', validate('param', paramSchema), async (context) => {
    const params = context.req.valid('param')

    const [channel] = await db
        .select()
        .from(tables.channels)
        .where(eq(tables.channels.id, params.id))
        .limit(1)

    if (!channel) {
        throw new HTTPException(404)
    }

    const items = await db
        .select()
        .from(tables.items)
        .where(eq(tables.items.channelId, channel.id))
        .orderBy(desc(tables.items.publishedAt))

    return context.json(items)
})
