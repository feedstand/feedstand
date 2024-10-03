import { HTTPException } from 'hono/http-exception'
import { JSDOM } from 'jsdom'
import { Feed } from '../types/schemas'
import { fetchAndParseFeed } from './fetchAndParseFeed'

const feedLinkSelectors = [
    'link[type="application/rss+xml"]',
    'link[type="application/atom+xml"]',
    'link[type="application/json"][rel="alternate"]',
    'link[type="application/feed+json"]',
]

const htmlContentTypes = ['text/html', 'application/xhtml+xml']

// TODO: Make it extensible by providing a way to parse and discover feeds differently depending on
// the service. For example, if a user provides a link to a YouTube video, we could obtain the HTML
// of the author's YouTube channel and retrieve the RSS feed from there.
export const fetchAndDiscoverFeeds = async (pageUrl: string): Promise<Array<Feed>> => {
    const response = await fetch(pageUrl)
    const contentType = response.headers.get('content-type')
    const isHtmlPage = contentType && htmlContentTypes.some((type) => contentType.includes(type))

    if (!isHtmlPage) {
        throw new HTTPException(422)
    }

    const html = await response.text()

    const jsdom = new JSDOM(html, { url: pageUrl })
    const links = jsdom.window.document.querySelectorAll(feedLinkSelectors.join())
    const feeds: Array<Feed> = []

    for (const link of links) {
        const linkHref = link.getAttribute('href')
        const feedUrl = linkHref ? new URL(linkHref, pageUrl).href : undefined

        if (!feedUrl) continue

        const { channel } = await fetchAndParseFeed(feedUrl)

        feeds.push({ url: feedUrl, title: channel.title })
    }

    return feeds
}
