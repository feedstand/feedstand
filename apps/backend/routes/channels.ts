import { app } from '~/instances/server.js'
import { fetchChannelById } from '~/actions/fetchChannelById.js'
import { deleteOrphanChannels } from '~/actions/deleteOrphanChannels.js'
import { scanExistingChannel } from '~/actions/scanExistingChannel.js'

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

    await scanExistingChannel(channel)

    return reply.send()
})
