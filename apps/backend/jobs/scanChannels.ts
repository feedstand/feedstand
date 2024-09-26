import { scanExistingChannel } from '../actions/scanExistingChannel'
import { tables } from '../database/tables'
import { db } from '../instances/database'

export const scanChannels = async () => {
    // TODO: Consider adding support for adjusting scanning frequency based on the actual new items
    // being added to the feed. Elegant solution: https://stackoverflow.com/a/6651638.
    const channels = await db.select().from(tables.channels)

    for (const channel of channels) {
        scanExistingChannel(channel)
    }
}
