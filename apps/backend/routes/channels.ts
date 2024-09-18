import { app } from '~/instances/server.js'
import { parseRequestToSchema } from '~/helpers/routes.js'
import { z } from 'zod'
import { db } from '~/instances/database.js'
import { channels, items } from '~/database/tables.js'
import { eq } from 'drizzle-orm'
import { NewItem } from '~/types/database.js'
import { fetchAndParseFeed } from '~/actions/fetchAndParseFeed.js'

app.get('/channels/:id', async (request, reply) => {
    const schema = z.object({ params: z.object({ id: z.coerce.number() }) })
    const { params } = parseRequestToSchema({ request, reply, schema })

    const channel = await db.query.channels.findFirst({
        where: (channels, { eq }) => eq(channels.id, params.id),
    })

    if (!channel) {
        // TODO: Implement custom error class and handling them in Fastify.
        throw new Error()
    }

    return reply.send(channel)
})

app.get('/channels/:id/scan', async (request, reply) => {
    const schema = z.object({ params: z.object({ id: z.coerce.number() }) })
    const { params } = parseRequestToSchema({ request, reply, schema })

    const channel = await db.query.channels.findFirst({
        where: (channels, { eq }) => eq(channels.id, params.id),
    })

    if (!channel) {
        // TODO: Implement custom error class and handling them in Fastify.
        throw new Error()
    }

    // TODO: Consider adding support for adjusting scanning frequency based on the actual new items
    // being added to the feed. Elegant solution: https://stackoverflow.com/a/6651638.

    const feed = await fetchAndParseFeed(channel.url)

    const newItems: Array<NewItem> = []

    for (const newItem of feed.items) {
        newItems.push({ ...newItem, channelId: channel.id })
    }

    await db
        .insert(items)
        .values(newItems)
        .onConflictDoNothing({ target: [items.channelId, items.guid] })

    await db
        .update(channels)
        .set({ ...feed.channel, lastScannedAt: new Date() })
        .where(eq(channels.id, channel.id))

    return reply.send()
})
