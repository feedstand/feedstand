import { HTTPException } from 'hono/http-exception'
import { JSDOM } from 'jsdom'
import { anyFeedContentTypes, feedLinkSelectors, htmlContentTypes } from '../constants/scrapers'
import { isOneOfContentTypes } from '../helpers/scrapers'
import { FeedInfo } from '../types/schemas'
import { fetchExternalUrl } from './fetchExternalUrl'
import { parseFeed } from './parseFeed'

type FindFeeds = (response: Response, pageOrFeedUrl: string) => Promise<Array<FeedInfo>>

// TODO: Make it extensible by providing a way to parse and discover feeds differently depending on
// the service. For example, if a user provides a link to a YouTube video, we could obtain the HTML
// of the author's YouTube channel and retrieve the RSS feed from there.
export const findFeeds: FindFeeds = async (response, pageOrFeedUrl) => {
    if (isOneOfContentTypes(response, anyFeedContentTypes)) {
        const { channel } = await parseFeed(response)

        return [{ title: channel.title, url: channel.url }]
    }

    if (!isOneOfContentTypes(response, htmlContentTypes)) {
        throw new HTTPException(422)
    }

    const html = await response.text()
    const jsdom = new JSDOM(html, { url: pageOrFeedUrl })
    const feedLinks = jsdom.window.document.querySelectorAll(feedLinkSelectors.join())
    const feedInfos: Array<FeedInfo> = []

    for (const feedLink of feedLinks) {
        const linkHref = feedLink.getAttribute('href')
        const feedTitle = feedLink.getAttribute('title')
        const feedUrl = linkHref ? new URL(linkHref, pageOrFeedUrl).href : undefined

        if (!feedUrl) {
            continue
        }

        // TODO: Maybe it's better to stick to the actual name of the feed stored in the feed URL?
        // `title` attribute and the actual feed name can differ.
        if (feedTitle) {
            feedInfos.push({ url: feedUrl, title: feedTitle })
            continue
        }

        const response = await fetchExternalUrl(feedUrl)
        const { channel } = await parseFeed(response)
        feedInfos.push({ url: feedUrl, title: channel.title })
    }

    return feedInfos
}
