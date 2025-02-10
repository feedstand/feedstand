import { load } from 'cheerio'
import { fetchFeed } from '../../actions/fetchFeed'
import { FindFeedsProcessor } from '../../actions/findFeeds'
import { feedLinkSelectors } from '../../constants/finders'
import { FoundFeeds } from '../../types/schemas'

export const webpageFinder: FindFeedsProcessor = async (context, next) => {
    if (!context.response?.ok) {
        return await next()
    }

    // TODO: Should content type check be skipped? In the real world, feeds do not always set the
    // correct content type indicating XML which result in some feeds not being correctly scanned.
    // if (!isOneOfContentTypes(context.response, htmlContentTypes)) {
    //     return
    // }

    const html = await context.response.clone().text()
    const $ = load(html)
    const feedLinks = $(feedLinkSelectors.join())
    const feeds: FoundFeeds['feeds'] = []

    for (const feedLink of feedLinks) {
        const linkHref = $(feedLink).attr('href')
        const feedUrl = linkHref ? new URL(linkHref, context.response.url).href : undefined

        if (!feedUrl) {
            continue
        }

        // // TODO: Maybe it's better to stick to the actual name of the feed stored in the feed
        // // URL? `title` attribute and the actual feed name can differ.
        // const feedTitle = feedLink.getAttribute('title')
        //
        // if (feedTitle) {
        //     feedInfos.push({ url: feedUrl, title: feedTitle })
        //     continue
        // }

        const { channel } = await fetchFeed({ url: feedUrl, channel: context?.channel })

        feeds.push({ url: channel.feedUrl, title: channel.title })
    }

    if (feeds.length) {
        context.result = {
            etag: context.response.headers.get('etag'),
            feeds,
        }
    }

    await next()
}
