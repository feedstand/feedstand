import { eq } from 'drizzle-orm'
import { z } from 'zod'
import { scanExistingChannel } from '~/actions/scanExistingChannel'
import { tables } from '~/database/tables'
import { validate } from '~/helpers/routes'
import { db } from '~/instances/database'
import { hono } from '~/instances/hono'

const paramSchema = z.object({ id: z.coerce.number() })

// TODO: Move this to background job running periodically.
hono.get('/channels/:id/scan', validate('param', paramSchema), async (context) => {
    // TODO: Consider adding support for adjusting scanning frequency based on the actual new items
    // being added to the feed. Elegant solution: https://stackoverflow.com/a/6651638.
    const params = context.req.valid('param')

    const [channel] = await db
        .select()
        .from(tables.channels)
        .where(eq(tables.channels.id, params.id))
        .limit(1)

    if (!channel) {
        return context.notFound()
    }

    await scanExistingChannel(channel)
})
