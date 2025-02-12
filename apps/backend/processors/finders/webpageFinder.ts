import { load } from 'cheerio'
import { fetchFeed } from '../../actions/fetchFeed'
import { FindFeedsProcessor } from '../../actions/findFeeds'
import { feedLinkSelectors } from '../../constants/finders'
import { resolveRelativeUrl } from '../../helpers/urls'
import { FoundFeeds } from '../../types/schemas'

export const extractFeedUrls = (html: string, baseUrl: string): Array<string> => {
    const $ = load(html)
    const linkElements = $(feedLinkSelectors.join())
    const feedUrls: Array<string> = []

    for (const linkElement of linkElements) {
        const linkHref = $(linkElement).attr('href')

        if (!linkHref) {
            continue
        }

        feedUrls.push(resolveRelativeUrl(linkHref, baseUrl))
    }

    return feedUrls
}

export const webpageFinder: FindFeedsProcessor = async (context, next) => {
    if (!context.response?.ok || !context.responseText) {
        return await next()
    }

    // TODO: Should content type check be skipped? In the real world, feeds do not always set the
    // correct content type indicating XML which result in some feeds not being correctly scanned.
    // if (!isOneOfContentTypes(context.response, htmlContentTypes)) {
    //     return
    // }

    const html = context.responseText
    const feedUrls = extractFeedUrls(html, context.response.url)
    const feeds: FoundFeeds['feeds'] = []

    for (const feedUrl of feedUrls) {
        // TODO: Consider simplifying retrival of the feed title to getting it from the link attr.
        // const feedTitle = feedLink.getAttribute('title')
        //
        // if (feedTitle) {
        //     feedInfos.push({ url: feedUrl, title: feedTitle })
        //     continue
        // }

        const { channel } = await fetchFeed({ url: feedUrl, channel: context.channel })

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
