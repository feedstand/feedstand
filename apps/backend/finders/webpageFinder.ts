import { JSDOM } from 'jsdom'
import { fetchFeed } from '../actions/fetchFeed'
import { parseFeed } from '../actions/parseFeed'
import { feedLinkSelectors } from '../constants/finders'
import { htmlContentTypes } from '../constants/parsers'
import { isOneOfContentTypes } from '../helpers/responses'
import { FeedInfo } from '../types/schemas'

export const webpageFinder = async (response: Response, url: string) => {
    if (!isOneOfContentTypes(response, htmlContentTypes)) {
        return
    }

    const html = await response.text()
    const jsdom = new JSDOM(html, { url })
    const feedLinks = jsdom.window.document.querySelectorAll(feedLinkSelectors.join())
    const feedInfos: Array<FeedInfo> = []

    for (const feedLink of feedLinks) {
        const linkHref = feedLink.getAttribute('href')
        const feedUrl = linkHref ? new URL(linkHref, url).href : undefined

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

        const response = await fetchFeed(feedUrl)
        const { channel } = await parseFeed(response, feedUrl)
        feedInfos.push({ url: feedUrl, title: channel.title })
    }

    return feedInfos
}
