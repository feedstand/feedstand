import { JSDOM } from 'jsdom'
import { fetchExternalUrl } from '../actions/fetchExternalUrl'
import { parseFeed } from '../actions/parseFeed'
import { feedLinkSelectors, htmlContentTypes } from '../constants/scrapers'
import { isOneOfContentTypes } from '../helpers/scrapers'
import { FeedInfo } from '../types/schemas'
import { BaseFeedFinder } from './BaseFeedFinder'

export class WebpageFeedFinder extends BaseFeedFinder {
    async canHandle(response: Response) {
        return isOneOfContentTypes(response, htmlContentTypes)
    }

    async findFeeds(response: Response, url: string) {
        const html = await response.text()
        const jsdom = new JSDOM(html, { url })
        const feedLinks = jsdom.window.document.querySelectorAll(feedLinkSelectors.join())
        const feedInfos: Array<FeedInfo> = []

        for (const feedLink of feedLinks) {
            const linkHref = feedLink.getAttribute('href')
            const feedTitle = feedLink.getAttribute('title')
            const feedUrl = linkHref ? new URL(linkHref, url).href : undefined

            if (!feedUrl) {
                continue
            }

            // TODO: Maybe it's better to stick to the actual name of the feed stored in the feed
            // URL? `title` attribute and the actual feed name can differ.
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
}
