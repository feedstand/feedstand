import { hono } from '~/instances/hono'
import { deleteOrphanChannels } from '~/actions/deleteOrphanChannels'

// TODO: Move this to background job running periodically.
hono.get('/channels/delete', async (context) => {
    const deletedChannels = await deleteOrphanChannels()

    return context.json(deletedChannels, 200)
})
