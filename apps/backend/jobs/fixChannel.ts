import { fetchUrl } from '../actions/fetchUrl'
import { findFeeds } from '../actions/findFeeds'
import { Channel } from '../types/schemas'

export const fixChannel = async (channel: Channel) => {
    try {
        const response = await fetchUrl(channel.url)
        const feeds = await findFeeds({ response, channel })

        for (const feed of feeds) {
            if (!feed.url) {
                console.info('[fixChannel]', '[emptyUrl]', channel.url)
                continue
            }

            if (feed.url === channel.url) {
                continue
            }

            // const resolvedUrl = resolveRelativeUrl(feed.url, channel.url)

            console.info('[fixChannel]', '[feedUrl]', feed.url)
        }
    } catch (error) {
        // console.error('fixChannel', channel.url, error)
        // await db
        //     .update(tables.channels)
        //     .set({ error: convertErrorToString(error, { showNestedErrors: true }) })
        //     .where(eq(tables.channels.id, channel.id))
    }
}
