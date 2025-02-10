import { load } from 'cheerio'
import { fetchFeed, FetchFeedProcessor } from '../../actions/fetchFeed'

// Example: https://www.juhaliikala.com/rss.
export const redirectPage: FetchFeedProcessor = async (context, next) => {
    if (!context.response?.ok) {
        return await next()
    }

    const text = await context.response?.clone().text()
    const $ = load(text || '')
    const header = $('meta[http-equiv="refresh"]').attr('content')
    const [, url] = header?.match(/url=(.*)/i) || []

    if (url) {
        context.url = url
        context.response = undefined
        context.result = await fetchFeed(context)
    }

    await next()
}
