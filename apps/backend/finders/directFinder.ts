import { parseFeed } from '../actions/parseFeed'
import { anyFeedContentTypes } from '../constants/parsers'
import { isOneOfContentTypes } from '../helpers/responses'

export const directFinder = async (response: Response, url: string) => {
    if (!isOneOfContentTypes(response, anyFeedContentTypes)) {
        return
    }

    const { channel } = await parseFeed(response, url)

    return [{ title: channel.title, url: channel.url }]
}
