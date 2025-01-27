import { JSDOM } from 'jsdom'
import { fetchFeed } from '../actions/fetchFeed'
import { parseFeed } from '../actions/parseFeed'
import { feedLinkSelectors } from '../constants/finders'
import { htmlContentTypes } from '../constants/parsers'
import { isOneOfContentTypes } from '../helpers/responses'
import { FeedInfo } from '../types/schemas'
import { FeedFinder } from '../types/system'

export const webpageFinder: FeedFinder = async (response, options) => {
    if (!isOneOfContentTypes(response, htmlContentTypes)) {
        return
    }

    const html = await response.text()
    const jsdom = new JSDOM(html, { url: response.url })
    const feedLinks = jsdom.window.document.querySelectorAll(feedLinkSelectors.join())
    const feedInfos: Array<FeedInfo> = []

    for (const feedLink of feedLinks) {
        const linkHref = feedLink.getAttribute('href')
        const feedUrl = linkHref ? new URL(linkHref, response.url).href : undefined

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

        const feedResponse = await fetchFeed(feedUrl, options)
        const { channel } = await parseFeed(feedResponse, options)
        feedInfos.push({ url: channel.url, title: channel.title })
    }

    return feedInfos
}
