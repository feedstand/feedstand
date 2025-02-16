import { fetchFeed, FetchFeedProcessor } from '../../actions/fetchFeed'

export const extractRedirectUrl = (html: string): string | undefined => {
    const metaRegex = /<meta[^>]*?(?=.*?http-equiv\b)(?=.*?refresh\b)[^>]*>/i
    const [metaTag] = html.match(metaRegex) || []

    if (!metaTag) {
        return undefined
    }

    const contentRegex = /content=["']?\d*\s*;\s*url=(.*?)["'\s>]/i
    const [, contentAttr] = metaTag.match(contentRegex) || []

    return contentAttr || undefined
}

export const redirectPage: FetchFeedProcessor = async (context, next) => {
    if (!context.response?.ok || context.result) {
        return await next()
    }

    const html = await context.response.text()
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
