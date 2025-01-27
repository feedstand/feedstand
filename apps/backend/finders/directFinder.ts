import { parseFeed } from '../actions/parseFeed'
import { anyFeedContentTypes } from '../constants/parsers'
import { isOneOfContentTypes } from '../helpers/responses'
import { FeedFinder } from '../types/system'

export const directFinder: FeedFinder = async (response, options) => {
    if (!isOneOfContentTypes(response, anyFeedContentTypes)) {
        return
    }

    const { channel } = await parseFeed(response, options)

    return [{ title: channel.title, url: channel.url }]
}
