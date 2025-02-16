import { findFeeds, FindFeedsProcessor } from '../../actions/findFeeds'
import { extractRedirectUrl } from '../fetchers/redirectPage'

// TODO: Figure out a way to combine this with redirectPage processor from fetchers.
// The only thing they differ with is what function (workflow) they trigger if url exists.
export const redirectPage: FindFeedsProcessor = async (context, next) => {
    if (!context.response?.ok) {
        return await next()
    }

    const html = await context.response.text()
    const url = extractRedirectUrl(html)

    if (url) {
        context.url = url
        context.response = undefined
        context.result = await findFeeds(context)
    }

    await next()
}
