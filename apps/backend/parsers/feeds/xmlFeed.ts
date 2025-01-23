import { xmlFeedContentTypes } from '../../constants/parsers'
import { isOneOfContentTypes } from '../../helpers/finders'
import { parseXmlFeedChannel, parseXmlFeedItems } from '../../helpers/parsers'
import { rssParser } from '../../instances/rssParser'
import { FeedParser } from '../../types/system'

export const xmlFeed: FeedParser = async (response, url) => {
    if (!isOneOfContentTypes(response, xmlFeedContentTypes)) {
        return
    }

    const xml = await response.text()
    const feed = await rssParser.parseString(xml)

    return {
        channel: parseXmlFeedChannel(feed, url),
        items: parseXmlFeedItems(feed),
    }
}
