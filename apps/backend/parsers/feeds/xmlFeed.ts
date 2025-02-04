import { xmlFeedContentTypes } from '../../constants/parsers'
import { parseValue, trimStrings } from '../../helpers/parsers'
import { isOneOfContentTypes } from '../../helpers/responses'
import { rssParser } from '../../instances/rssParser'
import { XmlFeed } from '../../types/feeds'
import { FeedChannel, FeedItem } from '../../types/schemas'
import { FeedParser } from '../../types/system'
import { authorFromAtom } from '../values/authorFromAtom'
import { dateAi } from '../values/dateAi'
import { dateCustomFormat } from '../values/dateCustomFormat'
import { dateStandard } from '../values/dateStandard'
import { linkFromAtom } from '../values/linkFromAtom'
import { textStandard } from '../values/textStandard'

export const xmlFeedChannel = (feed: XmlFeed, url: string): FeedChannel => {
    return trimStrings({
        url: parseValue(feed.feedUrl, [textStandard], url),
        title: parseValue(feed.title, [textStandard]),
        link: parseValue(feed.link, [textStandard, linkFromAtom]),
        description: parseValue(feed.description, [textStandard]),
    })
}

export const xmlFeedItems = (feed: XmlFeed): Array<FeedItem> => {
    if (!feed.items?.length) {
        return []
    }

    const items: Array<FeedItem> = []

    for (const item of feed.items) {
        if (!item.link) {
            continue
        }

        const parsedLink = parseValue(item.link, [textStandard], '')

        items.push(
            trimStrings({
                link: parsedLink,
                guid: parseValue(item.guid, [textStandard], parsedLink),
                title: parseValue(item.title, [textStandard]),
                description: parseValue(item.summary, [textStandard]),
                author: parseValue(item.creator, [textStandard, authorFromAtom]),
                content: parseValue(item.content, [textStandard]),
                publishedAt: parseValue(
                    item.pubDate,
                    [dateStandard, dateCustomFormat, dateAi],
                    new Date(),
                ),
            }),
        )
    }

    return items
}

export const xmlFeed: FeedParser = async (response) => {
    if (!isOneOfContentTypes(response, xmlFeedContentTypes)) {
        return
    }

    const xml = await response.text()
    const feed = await rssParser.parseString(xml)

    return {
        channel: xmlFeedChannel(feed, response.url),
        items: xmlFeedItems(feed),
    }
}
