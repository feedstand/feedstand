import { JSDOM } from 'jsdom'
import { fetchExternalUrl } from '../actions/fetchExternalUrl'
import { parseFeed } from '../actions/parseFeed'
import { feedLinkSelectors } from '../constants/finders'
import { htmlContentTypes } from '../constants/parsers'
import { isOneOfContentTypes } from '../helpers/finders'
import { FeedInfo } from '../types/schemas'
import { BaseFinder } from './BaseFinder'

export class WebpageFinder extends BaseFinder {
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
            // const feedTitle = feedLink.getAttribute('title')
            const feedUrl = linkHref ? new URL(linkHref, url).href : undefined

            if (!feedUrl) {
                continue
            }

            // // TODO: Maybe it's better to stick to the actual name of the feed stored in the feed
            // // URL? `title` attribute and the actual feed name can differ.
            // if (feedTitle) {
            //     feedInfos.push({ url: feedUrl, title: feedTitle })
            //     continue
            // }

            const response = await fetchExternalUrl(feedUrl)
            const { channel } = await parseFeed(response, feedUrl)
            feedInfos.push({ url: feedUrl, title: channel.title })
        }

        return feedInfos
    }
}
