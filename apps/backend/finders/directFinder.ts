import { fetchFeed } from '../actions/fetchFeed'
import { anyFeedContentTypes } from '../constants/parsers'
import { isOneOfContentTypes } from '../helpers/responses'
import { FeedFinder } from '../types/system'

export const directFinder: FeedFinder = async (response, options) => {
    if (!isOneOfContentTypes(response, anyFeedContentTypes)) {
        return
    }

    const { channel } = await fetchFeed(response.url, {
        response,
        channel: options?.channel,
    })

    return [{ title: channel.title, url: channel.url }]
}
