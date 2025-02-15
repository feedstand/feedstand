import { load } from 'cheerio'
import { fetchFeed, FetchFeedProcessor } from '../../actions/fetchFeed'

export const extractRedirectUrl = (html: string) => {
    const $ = load(html)
    const header = $('meta[http-equiv="refresh"]').attr('content')
    const [, url] = header?.match(/url=(.*)/i) || []

    return url
}

export const redirectPage: FetchFeedProcessor = async (context, next) => {
    if (!context.response?.ok || !context.responseText) {
        return await next()
    }

    const html = context.responseText
    const url = extractRedirectUrl(html)

    if (url === context.url) {
        return await next()
    }

    if (url) {
        context.url = url
        context.response = undefined
        context.result = await fetchFeed(context)
    }

    await next()
}
