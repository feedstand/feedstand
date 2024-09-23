import { app } from '~/instances/server'
import { fetchRecordById } from '~/actions/fetchRecordById'
import { deleteOrphanChannels } from '~/actions/deleteOrphanChannels'
import { scanExistingChannel } from '~/actions/scanExistingChannel'
import { channels } from '~/database/tables'

app.post('/channels/delete', async (request, reply) => {
    // TODO: Move this to background job running periodically.

    const deletedChannels = await deleteOrphanChannels()

    return reply.send(deletedChannels)
})

app.get('/channels/:id', async (request, reply) => {
    const channel = await fetchRecordById(request, channels)

    return reply.send(channel)
})

app.get('/channels/:id/scan', async (request, reply) => {
    // TODO: Move this to background job running periodically.

    // TODO: Consider adding support for adjusting scanning frequency based on the actual new items
    // being added to the feed. Elegant solution: https://stackoverflow.com/a/6651638.

    const channel = await fetchRecordById(request, channels)

    await scanExistingChannel(channel)

    return reply.send()
})
