import { createHash } from 'crypto'
import { authorFromAtom } from '../parsers/authorFromAtom'
import { dateAi } from '../parsers/dateAi'
import { dateCustomFormat } from '../parsers/dateCustomFormat'
import { dateStandard } from '../parsers/dateStandard'
import { textStandard } from '../parsers/textStandard'
import { FeedItem, RawFeedItem } from '../types/schemas'
import { parseValue, trimStrings } from './parsers'

export const generateChecksum = (...values: Array<string | null | undefined>) => {
    return createHash('md5').update(values.join('')).digest('hex')
}

export const parseFeedItems = <I>(
    items: Array<I>,
    composeRawItem: (item: I) => RawFeedItem,
): Array<FeedItem> => {
    const parsedItems: Array<FeedItem> = []
    const uniqueChecksums: Set<string> = new Set()

    for (const item of items) {
        const rawItem = composeRawItem(item)

        if (!rawItem.link) {
            continue
        }

        const rawContent = rawItem.content

        const itemChecksum = generateChecksum(rawItem.guid, rawItem.link, rawItem.publishedAt)
        const contentChecksum = generateChecksum(rawContent)
        const combinedChecksum = [itemChecksum, contentChecksum].join(':')

        if (uniqueChecksums.has(combinedChecksum)) {
            continue
        }

        const parsedLink = parseValue(rawItem.link, [textStandard], '')
        const parsedItem = trimStrings({
            link: parsedLink,
            guid: parseValue(rawItem.guid, [textStandard], parsedLink),
            title: parseValue(rawItem.title, [textStandard]),
            description: parseValue(rawItem.description, [textStandard]),
            author: parseValue(rawItem.author, [textStandard, authorFromAtom]),
            content: parseValue(rawContent, [textStandard]),
            itemChecksum,
            contentChecksum,
            publishedAt: parseValue(
                rawItem.publishedAt,
                [dateStandard, dateCustomFormat, dateAi],
                new Date(),
            ),
            rawPublishedAt: rawItem.publishedAt,
        })

        parsedItems.push(parsedItem)
        uniqueChecksums.add(combinedChecksum)
    }

    return parsedItems
}
