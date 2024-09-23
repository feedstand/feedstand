import { app } from '~/instances/server'
import { fetchRecord } from '~/actions/fetchRecord'
import { deleteOrphanChannels } from '~/actions/deleteOrphanChannels'
import { scanExistingChannel } from '~/actions/scanExistingChannel'
import { tables } from '~/database/tables'

// TODO: Move this to background job running periodically.
app.post('/channels/delete', async (request, reply) => {
    const deletedChannels = await deleteOrphanChannels()

    return reply.send(deletedChannels)
})

app.get('/channels/:id', async (request, reply) => {
    const channel = await fetchRecord(request, tables.channels)

    return reply.send(channel)
})

// TODO: Move this to background job running periodically.
app.get('/channels/:id/scan', async (request, reply) => {
    // TODO: Consider adding support for adjusting scanning frequency based on the actual new items
    // being added to the feed. Elegant solution: https://stackoverflow.com/a/6651638.

    const channel = await fetchRecord(request, tables.channels)

    await scanExistingChannel(channel)

    return reply.send()
})
