import { app } from '~/instances/server.js'
import { db } from '~/instances/database.js'
import { channels, items } from '~/database/tables.js'
import { eq } from 'drizzle-orm'
import { NewItem } from '~/types/database.js'
import { fetchAndParseFeed } from '~/actions/fetchAndParseFeed.js'
import { fetchChannelById } from '~/actions/fetchChannelById.js'
import { deleteOrphanChannels } from '~/actions/deleteOrphanChannels.js'

app.post('/channels/delete', async (request, reply) => {
    // TODO: Move this to background job running periodically.

    const deletedChannels = await deleteOrphanChannels()

    return reply.send(deletedChannels)
})

app.get('/channels/:id', async (request, reply) => {
    const channel = await fetchChannelById(request)

    return reply.send(channel)
})

app.get('/channels/:id/scan', async (request, reply) => {
    // TODO: Move this to background job running periodically.

    // TODO: Consider adding support for adjusting scanning frequency based on the actual new items
    // being added to the feed. Elegant solution: https://stackoverflow.com/a/6651638.

    const channel = await fetchChannelById(request)
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
