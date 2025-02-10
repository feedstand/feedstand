import { load } from 'cheerio'
import { findFeeds, FindFeedsProcessor } from '../../actions/findFeeds'

// TODO: Figure out a way to combine this with redirectPage processor from fetchers.
// The only thing they differ with is what function (workflow) they trigger if url exists.
export const redirectPage: FindFeedsProcessor = async (context, next) => {
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
        context.result = await findFeeds(context)
    }

    await next()
}
