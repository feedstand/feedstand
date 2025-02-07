import { fetchFeed } from '../actions/fetchFeed'
import { FindFeedsMiddleware } from '../actions/findFeeds'

export const directFinder: FindFeedsMiddleware = async (context, next) => {
    if (!context.response?.ok) {
        return await next()
    }

    try {
        const feed = await fetchFeed(context.response.url, {
            response: context.response,
            channel: context.channel,
        })

        context.feedInfos = [{ title: feed.channel.title, url: feed.channel.url }]
    } catch (error) {
        context.error = error
    }

    await next()
}
