import { HTTPException } from 'hono/http-exception'
import { JSDOM } from 'jsdom'
import { feedLinkSelectors, htmlContentTypes } from '../constants/scrapers'
import { isOneOfContentTypes } from '../helpers/scrapers'
import { FeedInfo } from '../types/schemas'
import { fetchAndParseFeed } from './fetchAndParseFeed'

// TODO: Make it extensible by providing a way to parse and discover feeds differently depending on
// the service. For example, if a user provides a link to a YouTube video, we could obtain the HTML
// of the author's YouTube channel and retrieve the RSS feed from there.
export const fetchAndFindFeeds = async (pageUrl: string): Promise<Array<FeedInfo>> => {
    // TODO: Enable caching of requests based on headers in the response.
    const response = await fetch(pageUrl)

    if (!isOneOfContentTypes(response, htmlContentTypes)) {
        throw new HTTPException(422)
    }

    const html = await response.text()
    const jsdom = new JSDOM(html, { url: pageUrl })
    const feedLinks = jsdom.window.document.querySelectorAll(feedLinkSelectors.join())
    const feedInfos: Array<FeedInfo> = []

    for (const feedLink of feedLinks) {
        const linkHref = feedLink.getAttribute('href')
        const feedTitle = feedLink.getAttribute('title')
        const feedUrl = linkHref ? new URL(linkHref, pageUrl).href : undefined

        if (!feedUrl) {
            continue
        }

        if (feedTitle) {
            feedInfos.push({ url: feedUrl, title: feedTitle })
            continue
        }

        const { channel } = await fetchAndParseFeed(feedUrl)
        feedInfos.push({ url: feedUrl, title: channel.title })
    }

    return feedInfos
}
